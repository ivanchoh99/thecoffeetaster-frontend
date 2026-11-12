export interface User {
  id: string;
  email: string;
  name: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export interface BlockInfo {
  blocked: boolean;
  minutesRemaining?: number;
  /**
   * Identificador bloqueado. El bloqueo se aplica al identificador
   * introducido, exista o no la cuenta, para no revelar información de
   * cuentas (RN-05, S-03, S-11).
   */
  email?: string;
}

export type AuthReason = 'expired' | 'auth-required';

/** Rutas protegidas por `authGuard` (RN-09 / RN-22). */
export const PROTECTED_PATH_PREFIXES = ['/blog/editar', '/blog/preview'] as const;

/** Rutas que nunca son válidas como `returnUrl` (RN-18). */
export const FORBIDDEN_RETURN_PATHS = ['/login', '/logout'] as const;

/** Ventana deslizante de validez de la sesión de refresco, en días (RN-06). */
export const SESSION_REFRESH_WINDOW_DAYS = 7;
