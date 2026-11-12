import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AUTH_API, AuthError } from '../api/auth-api';
import { AUTH_MESSAGES } from '../messages/auth-messages';
import {
  AuthReason,
  AuthResponse,
  BlockInfo,
  LoginCredentials,
  SESSION_REFRESH_WINDOW_DAYS,
  User,
} from '../models/auth.model';

/** Clave de almacenamiento del instante del último refresco de sesión. */
const REFRESH_TIMESTAMP_KEY = 'tct.auth.lastRefresh';

/** Prefijo de las claves de intentos fallidos por identificador. */
const ATTEMPTS_KEY_PREFIX = 'tct.auth.attempts.';

/** Prefijo de las claves de bloqueo temporal por identificador. */
const LOCK_KEY_PREFIX = 'tct.auth.lock.';

/** Marca persistente de que la sesión terminó por caducidad o refresh rechazado. */
const EXPIRED_FLAG_KEY = 'tct.auth.expired';

/** Vigencia por defecto del access token (S-05). */
const DEFAULT_ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000;

/** Margen antes del expiry para refrescar de forma preventiva. */
const REFRESH_MARGIN_MS = 60 * 1000;

/** Número de intentos fallidos consecutivos que provocan el bloqueo (RN-05). */
export const MAX_FAILED_ATTEMPTS = 5;

/** Duración del bloqueo temporal por intentos fallidos, en minutos (RN-05). */
export const LOCK_DURATION_MINUTES = 15;

/**
 * Servicio central de autenticación basado en Angular Signals.
 *
 * Responsabilidades:
 * - Mantener el estado autenticado (`currentUser`, `isAuthenticated`).
 * - Gestionar el access token (en memoria) y el refresh token (cookie httpOnly del backend).
 * - Refrescar la sesión ante actividad autenticada, reiniciando la ventana
 *   deslizante de 7 días (RN-06, RN-15).
 * - Exponer el estado de bloqueo por intentos fallidos (RN-05).
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  private readonly _currentUser = signal<User | null>(null);
  private readonly _blockInfo = signal<BlockInfo | null>(null);
  private readonly _accessToken = signal<string | null>(null);
  private readonly _accessTokenExpiresAt = signal<number | null>(null);

  /** Restauración de sesión en curso (compartida entre guards y coordinador). */
  private restorePromise: Promise<boolean> | null = null;

  /** `true` si la última pérdida de sesión fue un logout explícito (no una caducidad). */
  private readonly _loggedOut = signal(false);

  readonly loggedOut = this._loggedOut.asReadonly();

  readonly currentUser = this._currentUser.asReadonly();
  readonly blockInfo = this._blockInfo.asReadonly();
  readonly isAuthenticated = computed(() => this._currentUser() !== null);

  /** Nombre a mostrar en el header: nombre del perfil o parte local del email (S-07). */
  readonly displayName = computed(() => {
    const user = this._currentUser();
    if (!user) {
      return '';
    }
    return user.name?.trim() || user.email.split('@')[0];
  });

  /**
   * Inicia sesión con email y contraseña.
   *
   * @throws {AuthError} con `kind` `invalid-credentials`, `blocked` o `network`.
   */
  async login(credentials: LoginCredentials): Promise<void> {
    const email = credentials.email.trim().toLowerCase();
    const remaining = this.remainingLockMinutes(email);
    if (remaining !== null) {
      this.setBlockInfo({ blocked: true, minutesRemaining: remaining, email });
      throw new AuthError('blocked', AUTH_MESSAGES.errorBlockedRemaining(remaining), remaining);
    }

    try {
      const response = await firstValueFrom(
        this.http.post<AuthResponse>(AUTH_API.login, credentials, { withCredentials: true }),
      );
      this.registerSuccess(email);
      this.applySession(response);
    } catch (error) {
      const authError = this.toAuthError(error, email);
      if (authError.kind === 'invalid-credentials') {
        const lock = this.registerFailure(email);
        if (lock !== null) {
          this.setBlockInfo({ blocked: true, minutesRemaining: lock, email });
          throw new AuthError('blocked', AUTH_MESSAGES.errorBlockedRemaining(lock), lock);
        }
      }
      throw authError;
    }
  }

  /**
   * Registra un intento fallido y activa el bloqueo local tras
   * {@link MAX_FAILED_ATTEMPTS} fallos consecutivos (RN-05).
   */
  private registerFailure(email: string): number | null {
    const attempts = (this.readAttempts(email) ?? 0) + 1;
    this.writeAttempts(email, attempts);

    if (attempts >= MAX_FAILED_ATTEMPTS) {
      const minutes = LOCK_DURATION_MINUTES;
      this.setBlockInfo({ blocked: true, minutesRemaining: minutes });
      this.writeLockUntil(email, Date.now() + minutes * 60 * 1000);
      return minutes;
    }

    return null;
  }

  /** Reinicia el contador de intentos tras un login exitoso (S-04). */
  private registerSuccess(email: string): void {
    this.writeAttempts(email, 0);
    this.writeLockUntil(email, null);
  }

  /**
   * Persiste un bloqueo por identificador indicado por el backend.
   * Sobrevive a la recarga de la página para mantener el aviso (RN-05).
   */
  private registerLock(email: string, minutesRemaining: number): void {
    this.writeLockUntil(email, Date.now() + minutesRemaining * 60 * 1000);
    this.writeAttempts(email, 0);
  }

  /**
   * Minutos restantes de bloqueo para un identificador, o `null` si no está
   * bloqueado. El bloqueo se aplica al identificador introducido, exista o no
   * la cuenta, para no revelar información de cuentas (S-03, S-11).
   */
  remainingLockMinutes(email: string): number | null {
    const lockUntil = this.readLockUntil(email);
    if (lockUntil === null) {
      return null;
    }

    const remaining = lockUntil - Date.now();
    if (remaining <= 0) {
      // Fin del bloqueo: se reinicia el contador (S-04).
      this.writeLockUntil(email, null);
      this.writeAttempts(email, 0);
      return null;
    }

    return Math.max(1, Math.ceil(remaining / 60000));
  }

  private readAttempts(email: string): number | null {
    return this.readNumber(`${ATTEMPTS_KEY_PREFIX}${email}`);
  }

  private writeAttempts(email: string, attempts: number): void {
    this.writeNumber(`${ATTEMPTS_KEY_PREFIX}${email}`, attempts);
  }

  private readLockUntil(email: string): number | null {
    return this.readNumber(`${LOCK_KEY_PREFIX}${email}`);
  }

  private writeLockUntil(email: string, timestamp: number | null): void {
    const key = `${LOCK_KEY_PREFIX}${email}`;
    if (timestamp === null) {
      this.removeKey(key);
      return;
    }
    this.writeNumber(key, timestamp);
  }

  private readNumber(key: string): number | null {
    try {
      const raw = globalThis.localStorage?.getItem(key);
      if (!raw) {
        return null;
      }
      const value = Number(raw);
      return Number.isFinite(value) ? value : null;
    } catch {
      return null;
    }
  }

  private writeNumber(key: string, value: number): void {
    try {
      globalThis.localStorage?.setItem(key, String(value));
    } catch {
      // Almacenamiento no disponible: el bloqueo no puede persistirse.
    }
  }

  private removeKey(key: string): void {
    try {
      globalThis.localStorage?.removeItem(key);
    } catch {
      // Ignorado.
    }
  }

  /**
   * Cierra sesión (RN-10). Invalida la sesión en cliente y, best effort, en backend.
   * Nunca lanza: un logout fallido deja al usuario igualmente sin sesión.
   */
  async logout(): Promise<void> {
    try {
      await firstValueFrom(this.http.post(AUTH_API.logout, {}, { withCredentials: true }));
    } catch {
      // El backend puede no estar disponible: la sesión local se invalida igual.
    }
    this.clearSession();
    this.writeExpiredFlag(false);
    this.writeLastRefresh(null);
    this._loggedOut.set(true);
  }

  /**
   * Renueva la sesión y reinicia la ventana deslizante de 7 días (RN-06).
   *
   * @returns `true` si la sesión quedó renovada.
   */
  async refreshSession(): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.http.post<AuthResponse>(AUTH_API.refresh, {}, { withCredentials: true }),
      );
      this.applySession(response);
      return true;
    } catch {
      this.clearSession();
      return false;
    }
  }

  /**
   * Restaura la sesión al arrancar la aplicación (cookie httpOnly del backend).
   * No lanza: si no hay sesión, la aplicación sigue en estado "sin registrar".
   *
   * Es idempotente: varias llamadas comparten la misma restauración en curso,
   * de modo que los guards puedan esperar a que el estado sea conocido.
   */
  restoreSession(): Promise<boolean> {
    if (!this.restorePromise) {
      this.restorePromise = this.performRestoreSession();
    }
    return this.restorePromise;
  }

  private async performRestoreSession(): Promise<boolean> {
    if (!this.hasValidRefreshWindow()) {
      this.clearSession();
      return false;
    }
    return this.refreshSession();
  }

  /** Token de acceso actual en memoria (se adjunta a las peticiones de la API). */
  get accessToken(): string | null {
    return this._accessToken();
  }

  /** `true` si el access token está próximo a caducar y conviene refrescar (RN-15). */
  shouldRefreshToken(): boolean {
    const expiresAt = this._accessTokenExpiresAt();
    if (!expiresAt) {
      return false;
    }
    return Date.now() >= expiresAt - REFRESH_MARGIN_MS;
  }

  /**
   * Motivo del aviso al redirigir a `/login` (RN-21).
   *
   * `expired` cuando existía una sesión previa pero la ventana deslizante de
   * 7 días ha caducado; `auth-required` en cualquier otro caso.
   */
  expiredSessionReason(): AuthReason {
    if (this.readExpiredFlag() || (this.readLastRefresh() !== null && !this.hasValidRefreshWindow())) {
      return 'expired';
    }
    return 'auth-required';
  }

  /** Marca (o desmarca) que la sesión terminó por caducidad (RN-07 / RN-21). */
  writeExpiredFlag(value: boolean): void {
    try {
      if (value) {
        globalThis.localStorage?.setItem(EXPIRED_FLAG_KEY, '1');
        return;
      }
      globalThis.localStorage?.removeItem(EXPIRED_FLAG_KEY);
    } catch {
      // Ignorado.
    }
  }

  /** Lee la marca de sesión caducada. */
  readExpiredFlag(): boolean {
    try {
      return globalThis.localStorage?.getItem(EXPIRED_FLAG_KEY) === '1';
    } catch {
      return false;
    }
  }

  /** Indica si la ventana deslizante de refresco de 7 días ha caducado (RN-06). */
  hasValidRefreshWindow(): boolean {
    const last = this.readLastRefresh();
    if (last === null) {
      return false;
    }
    return Date.now() - last < SESSION_REFRESH_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  }

  /** Instante (ms) del último refresco de sesión; `null` si nunca se refrescó. */
  readLastRefresh(): number | null {
    try {
      const raw = globalThis.localStorage?.getItem(REFRESH_TIMESTAMP_KEY);
      if (!raw) {
        return null;
      }
      const value = Number(raw);
      return Number.isFinite(value) ? value : null;
    } catch {
      return null;
    }
  }

  /** Aplica una respuesta de sesión válida: usuario, token y ventana de refresco. */
  private applySession(response: AuthResponse): void {
    this._currentUser.set(response.user);
    this._accessToken.set(response.accessToken);
    this._accessTokenExpiresAt.set(Date.now() + DEFAULT_ACCESS_TOKEN_TTL_MS);
    this._blockInfo.set(null);
    this.writeLastRefresh(Date.now());
    this.writeExpiredFlag(false);
    this._loggedOut.set(false);
  }

  /**
   * Elimina la sesión local (RN-07: fallo del refresco → sesión eliminada).
   * La ventana de refresco se conserva para poder distinguir el motivo
   * "expired" de "auth-required" (RN-21).
   */
  clearSession(): void {
    this._currentUser.set(null);
    this._accessToken.set(null);
    this._accessTokenExpiresAt.set(null);
    this._blockInfo.set(null);

    // Solo se marca "caducada" si existía una sesión previa: un visitante que
    // nunca ha iniciado sesión no debe ver el aviso de expiración (RN-21).
    if (this.readLastRefresh() !== null) {
      this.writeExpiredFlag(true);
    }
  }

  /** Marca la cuenta como bloqueada temporalmente (RN-05). */
  setBlockInfo(info: BlockInfo | null): void {
    this._blockInfo.set(info);
  }

  /**
   * Bloqueo vigente para un identificador concreto (RN-05).
   * El bloqueo se aplica al identificador introducido, exista o no la cuenta,
   * para no revelar si el email está registrado (S-03, S-11).
   */
  blockInfoFor(email: string): BlockInfo | null {
    const block = this._blockInfo();
    if (!block?.blocked || !block.email) {
      return null;
    }
    return block.email === email.trim().toLowerCase() ? block : null;
  }

  private writeLastRefresh(timestamp: number | null): void {
    try {
      if (timestamp === null) {
        globalThis.localStorage?.removeItem(REFRESH_TIMESTAMP_KEY);
        return;
      }
      globalThis.localStorage?.setItem(REFRESH_TIMESTAMP_KEY, String(timestamp));
    } catch {
      // Almacenamiento no disponible (modo privado): la sesión sigue en memoria.
    }
  }

  private toAuthError(error: unknown, email?: string): AuthError {
    if (error instanceof AuthError) {
      return error;
    }

    if (error instanceof HttpErrorResponse) {
      const body = (error.error ?? {}) as {
        message?: string;
        code?: string;
        minutesRemaining?: number;
        retryAfterSeconds?: number;
      };

      if (error.status === 429 || body.code === 'account_locked' || body.code === 'locked') {
        const minutesRemaining =
          body.minutesRemaining ?? this.minutesFromRetryAfter(body.retryAfterSeconds);
        this.setBlockInfo({ blocked: true, minutesRemaining, email });

        // El bloqueo se persiste por identificador para que sobreviva a una
        // recarga de la página (RN-05).
        if (email && minutesRemaining) {
          this.registerLock(email, minutesRemaining);
        }

        return new AuthError(
          'blocked',
          minutesRemaining
            ? AUTH_MESSAGES.errorBlockedRemaining(minutesRemaining)
            : AUTH_MESSAGES.errorBlocked,
          minutesRemaining,
        );
      }

      if (error.status === 0) {
        return new AuthError('network', 'No se pudo conectar con el servidor');
      }

      if (error.status === 401 || error.status === 403) {
        return new AuthError('invalid-credentials', AUTH_MESSAGES.errorInvalidCredentials);
      }
    }

    return new AuthError('unknown', AUTH_MESSAGES.errorInvalidCredentials);
  }

  private minutesFromRetryAfter(seconds?: number): number | undefined {
    if (!seconds || !Number.isFinite(seconds) || seconds <= 0) {
      return undefined;
    }
    return Math.max(1, Math.ceil(seconds / 60));
  }
}
