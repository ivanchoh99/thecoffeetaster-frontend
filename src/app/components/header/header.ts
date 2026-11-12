import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { MatToolbar } from '@angular/material/toolbar';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { AUTH_MESSAGES } from '../../core/messages/auth-messages';
import { AuthService } from '../../core/services/auth.service';
import { isProtectedPath } from '../../core/utils/protected-path.util';

@Component({
  selector: 'app-header',
  imports: [MatToolbar, RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header {
  private readonly menuTrigger = viewChild<ElementRef<HTMLButtonElement>>('menuTrigger');
  private readonly hamburgerButton = viewChild<ElementRef<HTMLButtonElement>>('hamburger');

  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly host = inject(ElementRef<HTMLElement>);

  protected readonly messages = AUTH_MESSAGES;

  /** Estado del menú desplegable de usuario. */
  protected readonly menuOpen = signal(false);

  /** Estado del menú hamburguesa (móvil). */
  protected readonly mobileMenuOpen = signal(false);

  protected readonly displayName = computed(() => this.auth.displayName());

  /** URL actual del router, reactiva a cada navegación. */
  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  /**
   * Parámetros de query del botón "Iniciar sesión" (RN-20):
   * la ruta actual (path + query, sin fragmento) como `returnUrl`.
   */
  protected readonly loginQueryParams = computed(() => {
    const current = this.currentUrl().split('#')[0];
    const path = current.split('?')[0];
    // En `/login` no se genera `returnUrl` (destino home) — RN-20.
    return path && path !== '/login' ? { returnUrl: current } : {};
  });

  /** Abre/cierra el menú de usuario. */
  protected toggleMenu(event: Event): void {
    event.stopPropagation();
    const willOpen = !this.menuOpen();
    this.menuOpen.set(willOpen);
    this.mobileMenuOpen.set(false);

    // Al abrir con teclado, el foco entra en la primera opción (HU-04).
    // `detail === 0` identifica una activación por teclado (Enter/Espacio).
    if (willOpen && event instanceof MouseEvent && event.detail === 0) {
      this.focusMenuOption(0);
    }
  }

  /** Abre/cierra el menú hamburguesa (móvil). */
  protected toggleMobileMenu(event: Event): void {
    event.stopPropagation();
    this.mobileMenuOpen.update((open) => !open);
    this.menuOpen.set(false);
  }

  /** Cierra los menús al pulsar Escape y devuelve el foco al disparador. */
  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (this.menuOpen()) {
      this.closeMenus();
      this.menuTrigger()?.nativeElement.focus();
    } else if (this.mobileMenuOpen()) {
      this.closeMenus();
      this.hamburgerButton()?.nativeElement.focus();
    }
  }

  /** Cierra los menús al hacer clic fuera del header. */
  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    if (!this.host.nativeElement.contains(event.target as Node)) {
      this.closeMenus();
    }
  }

  protected closeMenus(): void {
    this.menuOpen.set(false);
    this.mobileMenuOpen.set(false);
  }

  /** Navegación con teclado dentro del menú (HU-04). */
  protected onMenuKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const options = this.menuOptions();
      if (options.length === 0) {
        return;
      }

      const current = options.findIndex((option) => option === document.activeElement);
      const delta = event.key === 'ArrowDown' ? 1 : -1;
      const next = current === -1 ? 0 : (current + delta + options.length) % options.length;
      options[next].focus();
    }
  }

  /** Mueve el foco a la opción `index` del menú de usuario. */
  private focusMenuOption(index: number): void {
    const options = this.menuOptions();
    options[index]?.focus();
  }

  /** Opciones del menú de usuario (desktop). */
  private menuOptions(): HTMLButtonElement[] {
    const element = this.host.nativeElement as HTMLElement;
    return Array.from(element.querySelectorAll<HTMLButtonElement>('.user-menu__item'));
  }

  /** Cierra la sesión (RN-10). */
  protected async logout(): Promise<void> {
    this.closeMenus();
    await this.auth.logout();

    // RN-16: en rutas protegidas se fuerza recarga completa para purgar el
    // contenido protegido en caché; en rutas públicas el header se actualiza solo.
    if (this.isProtectedPath(this.router.url)) {
      window.location.assign('/');
      return;
    }

    await this.router.navigateByUrl('/');
  }

  /** Indica si una URL corresponde a una ruta protegida (RN-09). */
  protected isProtectedPath(url: string): boolean {
    return isProtectedPath(url);
  }
}
