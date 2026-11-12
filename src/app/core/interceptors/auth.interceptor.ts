import {
  HttpErrorResponse,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, catchError, from, switchMap, throwError } from 'rxjs';
import { AUTH_API } from '../api/auth-api';
import { AuthService } from '../services/auth.service';

/**
 * Interceptor de autenticación.
 *
 * - Adjunta el access token en memoria a las peticiones de la API.
 * - Refresca de forma preventiva el token cuando está próximo a caducar y el
 *   usuario está activo (RN-15).
 * - Ante un `401`, intenta un único refresco de sesión y reintenta la
 *   petición original (RN-06). Si el refresco falla, la sesión local se
 *   elimina (RN-07).
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);

  if (!isApiRequest(req.url) || isAuthEndpoint(req.url)) {
    return next(req);
  }

  const send = () => next(attachToken(req, auth.accessToken));

  // Refresco preventivo: solo si hay sesión activa.
  if (auth.isAuthenticated() && auth.shouldRefreshToken()) {
    return from(auth.refreshSession()).pipe(
      switchMap((refreshed) =>
        refreshed
          ? send()
          : // La sesión ya no es válida: se propaga un 401 sintético.
            throwError(
              () =>
                new HttpErrorResponse({
                  status: 401,
                  statusText: 'Session expired',
                  url: req.url,
                }),
            ),
      ),
    );
  }

  return send().pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
        return throwError(() => error);
      }

      if (!auth.isAuthenticated()) {
        return throwError(() => error);
      }

      return from(auth.refreshSession()).pipe(
        switchMap((refreshed) => {
          if (!refreshed) {
            return throwError(() => error);
          }
          return next(attachToken(req, auth.accessToken));
        }),
      );
    }),
  );
};

function isApiRequest(url: string): boolean {
  return url.startsWith('/api/');
}

/** Los endpoints de autenticación no se reintentan (evita bucles de refresco). */
function isAuthEndpoint(url: string): boolean {
  return [AUTH_API.login, AUTH_API.refresh, AUTH_API.logout].some((path) => url.includes(path));
}

function attachToken(req: HttpRequest<unknown>, token: string | null): HttpRequest<unknown> {
  if (!token) {
    return req;
  }
  return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}
