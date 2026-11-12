import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard de rutas protegidas (RN-09).
 *
 * Espera a que la restauración de sesión termine (cookie httpOnly del backend)
 * antes de decidir: de otro modo, una recarga de una ruta protegida
 * redirigiría a `/login` aunque la sesión siguiera vigente.
 *
 * Sin sesión activa redirige a `/login` conservando el deep link en
 * `returnUrl` y el motivo en `reason` (RN-21).
 */
export const authGuard: CanActivateFn = async (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await auth.restoreSession();

  if (auth.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/login'], {
    queryParams: {
      returnUrl: state.url,
      reason: auth.expiredSessionReason(),
    },
  });
};
