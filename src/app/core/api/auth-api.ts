/**
 * Contrato de la API de autenticación.
 *
 * La API de backend aún no existe (ver `01-product-manager.md`, §Dependencias).
 * Este archivo fija el contrato que el frontend espera, de forma que el
 * servicio pueda cambiarse por completo cuando el backend esté disponible.
 *
 * - `POST /api/auth/login`    → `{ user, accessToken }` (el refresh token viaja en cookie httpOnly)
 * - `POST /api/auth/refresh`  → `{ user, accessToken }` (renueva la ventana deslizante de 7 días)
 * - `POST /api/auth/logout`   → invalida la sesión en backend
 */
export const AUTH_API = {
  login: '/api/auth/login',
  refresh: '/api/auth/refresh',
  logout: '/api/auth/logout',
} as const;

/** Motivos de fallo de autenticación manejados por la UI. */
export type AuthFailureKind = 'invalid-credentials' | 'blocked' | 'network' | 'unknown';

export class AuthError extends Error {
  constructor(
    readonly kind: AuthFailureKind,
    message: string,
    readonly minutesRemaining?: number,
  ) {
    super(message);
    this.name = 'AuthError';
  }
}
