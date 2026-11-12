import { Injectable, Injector, effect, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from './auth.service';
import { isProtectedPath } from '../utils/protected-path.util';

/**
 * Coordinador de sesión.
 *
 * - Restaura la sesión al arrancar la aplicación (cookie httpOnly del backend).
 * - Renueva la sesión ante actividad autenticada (navegación) — RN-15.
 * - Cuando la sesión caduca estando en una ruta protegida, redirige a
 *   `/login` con `reason=expired` y conserva el deep link — RN-07 / RN-23.
 */
@Injectable({ providedIn: 'root' })
export class SessionCoordinator {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly injector = inject(Injector);

  private initialized = false;
  private wasAuthenticated = false;

  /** Inicia el coordinador. Idempotente. */
  init(): void {
    if (this.initialized) {
      return;
    }
    this.initialized = true;

    this.wasAuthenticated = this.auth.isAuthenticated();

    // Detecta la pérdida de sesión en caliente (caducidad o refresh rechazado)
    // estando en una ruta protegida (RN-07). En rutas públicas no hay
    // redirección ni aviso (RN-23).
    effect(
      () => {
        const authenticated = this.auth.isAuthenticated();
        if (authenticated || !this.wasAuthenticated) {
          this.wasAuthenticated = authenticated;
          return;
        }

        this.wasAuthenticated = false;
        // Un logout explícito ya gestiona su propia redirección (RN-10).
        if (this.auth.loggedOut()) {
          return;
        }
        this.redirectIfProtected(this.auth.expiredSessionReason());
      },
      { injector: this.injector },
    );

    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => {
        void this.onNavigation();
      });

    // Restaura la sesión previa. Si el backend no está disponible, la app
    // sigue funcionando en estado "sin registrar" (sin redirección forzada).
    void this.auth.restoreSession().then((restored) => {
      this.wasAuthenticated = this.auth.isAuthenticated();
      if (!restored && this.auth.expiredSessionReason() === 'expired') {
        this.redirectIfProtected('expired');
      }
    });
  }

  private async onNavigation(): Promise<void> {
    if (!this.auth.isAuthenticated()) {
      // El guard ya redirige con `auth-required` cuando no hay sesión.
      return;
    }

    // Actividad autenticada: renueva la sesión de forma preventiva (RN-15).
    if (this.auth.shouldRefreshToken()) {
      const refreshed = await this.auth.refreshSession();
      if (!refreshed) {
        this.redirectIfProtected('expired');
      }
    }
  }

  /**
   * Redirige a `/login` si el usuario está en una ruta protegida y la sesión
   * ya no es válida. En rutas públicas no redirige ni muestra aviso (RN-23).
   */
  private redirectIfProtected(reason: 'expired' | 'auth-required'): void {
    const url = this.router.url;
    if (!isProtectedPath(url)) {
      return;
    }

    const returnUrl = url.split('#')[0];
    void this.router.navigate(['/login'], {
      queryParams: { returnUrl, reason },
    });
  }
}
