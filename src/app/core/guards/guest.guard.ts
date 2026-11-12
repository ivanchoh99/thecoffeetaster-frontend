import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { sanitizeReturnUrl } from '../utils/return-url.util';

/**
 * Guard de la ruta `/login` (solo invitados).
 *
 * Espera a que la restauración de sesión termine para no mostrar el formulario
 * a un usuario que sí tiene sesión (RN-19).
 *
 * Si el usuario ya está autenticado no se muestra el formulario: se redirige
 * al `returnUrl` válido o, en su defecto, a la home (RN-19).
 */
export const guestGuard: CanActivateFn = async (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await auth.restoreSession();

  if (!auth.isAuthenticated()) {
    return true;
  }

  const returnUrl = sanitizeReturnUrl(router, route.queryParamMap.get('returnUrl'));
  // `parseUrl` preserva la query string del deep link; `createUrlTree` la
  // codificaría como un segmento literal.
  return router.parseUrl(returnUrl ?? '/');
};
