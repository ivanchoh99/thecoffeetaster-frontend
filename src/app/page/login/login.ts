import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  computed,
  effect,
  inject,
  OnDestroy,
  signal,
  viewChild,
} from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthError } from '../../core/api/auth-api';
import { AUTH_MESSAGES } from '../../core/messages/auth-messages';
import { AuthReason } from '../../core/models/auth.model';
import { AuthService, LOCK_DURATION_MINUTES } from '../../core/services/auth.service';
import { isProtectedPath } from '../../core/utils/protected-path.util';
import { sanitizeReturnUrl } from '../../core/utils/return-url.util';
import { Header } from '../../components/header/header';

/** Validador de formato de email (RN-01). */
function emailValidator(control: AbstractControl<string>): ValidationErrors | null {
  const value = (control.value ?? '').trim();
  if (!value) {
    return null;
  }
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? null : { email: true };
}

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, Header],
  templateUrl: './login.html',
  styleUrl: './login.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login implements OnDestroy {
  private readonly emailInput = viewChild<ElementRef<HTMLInputElement>>('emailInput');

  private blockTimer: ReturnType<typeof setInterval> | undefined;

  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);

  protected readonly messages = AUTH_MESSAGES;

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, emailValidator]],
    password: ['', [Validators.required]],
  });

  /** Estado de envío: evita el doble envío (HU-01). */
  protected readonly isSubmitting = signal(false);

  /** Error de credenciales o de red mostrado bajo los campos. */
  protected readonly loginError = signal<string | null>(null);

  /**
 * Bloqueo vigente para el identificador introducido (RN-05).
 * Se combina el bloqueo devuelto por el backend con el bloqueo local por
 * intentos fallidos; ambos se aplican por identificador, exista o no la
 * cuenta (S-03, S-11).
 */
  protected readonly blockInfo = computed(() => {
    // `tick` fuerza el recálculo para que la cuenta atrás avance.
    this.tick();

    const email = this.emailValue().trim().toLowerCase();
    if (!email) {
      return null;
    }

    const serverBlock = this.auth.blockInfoFor(email);
    if (serverBlock) {
      return { minutesRemaining: serverBlock.minutesRemaining ?? LOCK_DURATION_MINUTES };
    }

    const minutes = this.auth.remainingLockMinutes(email);
    return minutes === null ? null : { minutesRemaining: minutes };
  });

  /** Señal que fuerza el recálculo del bloqueo (cuenta atrás). */
  private readonly tick = signal(0);

  /** Motivo del aviso transportado en `reason` (RN-21). */
  protected readonly reason = signal<AuthReason | null>(null);

  /** Campo sobre el que se ha interactuado: los errores solo se muestran tras blur (RN-14). */
  protected readonly touchedFields = signal<Set<'email' | 'password'>>(new Set());

  /**
 * Valor de cada campo como señal, para que la plantilla reaccione a cada tecla.
 * Se observan los controles por separado (y no el grupo) porque un control
 * deshabilitado no emite en `form.valueChanges`.
 */
  private readonly emailValue = toSignal(this.form.controls.email.valueChanges, {
    initialValue: '',
  });

  private readonly passwordValue = toSignal(this.form.controls.password.valueChanges, {
    initialValue: '',
  });

  private readonly isEmailFormatValid = computed(() => {
    const value = this.emailValue().trim();
    return value !== '' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  });

  private readonly isPasswordFilled = computed(() => this.passwordValue().length > 0);

  protected readonly notice = computed(() => {
    switch (this.reason()) {
      case 'expired':
        return this.messages.noticeExpired;
      case 'auth-required':
        return this.messages.noticeAuthRequired;
      default:
        return null;
    }
  });

  /**
   * Mensaje anunciado por la región `aria-live` (RN-13).
   * Prioriza el error de credenciales, el bloqueo y los errores de campo.
   */
  protected readonly liveMessage = computed(() => {
    const credentialsError = this.loginError();
    if (credentialsError) {
      return credentialsError;
    }

    const minutes = this.blockInfo()?.minutesRemaining;
    if (minutes) {
      return this.messages.errorBlockedRemaining(minutes);
    }

    return this.emailError() ?? this.passwordError() ?? '';
  });

  protected readonly emailError = computed(() => {
    if (!this.touchedFields().has('email')) {
      return null;
    }
    return this.isEmailFormatValid() ? null : this.messages.errorInvalidEmail;
  });

  protected readonly passwordError = computed(() => {
    if (!this.touchedFields().has('password')) {
      return null;
    }
    return this.isPasswordFilled() ? null : this.messages.errorEmptyPassword;
  });

  /** El botón se habilita con email válido y contraseña no vacía (RN-14). */
  protected readonly canSubmit = computed(
    () =>
      !this.isSubmitting() &&
      !this.blockInfo() &&
      this.isEmailFormatValid() &&
      this.isPasswordFilled(),
  );

  constructor() {
    const reason = this.route.snapshot.queryParamMap.get('reason');
    this.reason.set(reason === 'expired' || reason === 'auth-required' ? reason : null);

    // El bloqueo del backend se aplica por identificador (RN-05): la señal
    // `blockInfo` lo resuelve a partir del email introducido.

    // RN-19: si el usuario ya está autenticado, no se muestra el formulario.
    // El `guestGuard` cubre la navegación; esta comprobación cubre el caso en
    // que la sesión se restaure mientras la página ya está montada.
    void this.auth.restoreSession().then((restored) => {
      if (restored && this.auth.isAuthenticated()) {
        const target =
          sanitizeReturnUrl(this.router, this.route.snapshot.queryParamMap.get('returnUrl')) ?? '/';
        void this.router.navigateByUrl(target);
      }
    });

    // Durante el bloqueo la contraseña y el envío quedan deshabilitados (UX 4.5).
    // El campo de email sigue editable para que el usuario pueda cambiar de
    // identificador (el bloqueo se aplica por identificador, RN-05).
    effect(() => {
      const blocked = this.blockInfo() !== null;
      const passwordControl = this.form.controls.password;

      if (blocked && passwordControl.enabled) {
        passwordControl.disable({ emitEvent: false });
      } else if (!blocked && passwordControl.disabled) {
        passwordControl.enable({ emitEvent: false });
      }
    });

    // Foco inicial en el campo de email (UX 7.1).
    afterNextRender(() => {
      this.emailInput()?.nativeElement.focus();
    });

    // Cuenta atrás del bloqueo: se recalcula cada 30 s (RN-05).
    this.blockTimer = setInterval(() => {
      this.tick.update((value) => value + 1);
    }, 30_000);
  }

  ngOnDestroy(): void {
    if (this.blockTimer !== undefined) {
      clearInterval(this.blockTimer);
    }
  }

  /** Marca un campo como interactuado para mostrar su error (RN-14). */
  protected markTouched(field: 'email' | 'password'): void {
    this.touchedFields.update((fields) => new Set(fields).add(field));
  }

  protected async onSubmit(): Promise<void> {
    if (!this.canSubmit()) {
      return;
    }

    this.isSubmitting.set(true);
    this.loginError.set(null);

    const { email, password } = this.form.getRawValue();

    try {
      await this.auth.login({ email: email.trim(), password });
      const returnUrl = sanitizeReturnUrl(
        this.router,
        this.route.snapshot.queryParamMap.get('returnUrl'),
      );
      const target = returnUrl ?? '/';

      // RN-16: si el destino es una ruta protegida, se fuerza una recarga
      // completa para purgar cualquier contenido protegido en caché.
      if (isProtectedPath(target)) {
        window.location.assign(target);
        return;
      }

      await this.router.navigateByUrl(target);
    } catch (error) {
      this.handleError(error);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  private handleError(error: unknown): void {
    if (error instanceof AuthError) {
      switch (error.kind) {
        case 'invalid-credentials':
          // RN-04: mensaje genérico, sin indicar qué campo falló.
          this.loginError.set(this.messages.errorInvalidCredentials);
          // S-02: se conserva el email y se limpia la contraseña.
          // No se marca el campo como tocado: el único mensaje visible es el
          // genérico de credenciales.
          this.form.controls.password.setValue('');
          break;
        case 'blocked':
          // El bloqueo ya está registrado en el servicio por identificador.
          this.form.controls.password.setValue('');
          break;
        case 'network':
          this.loginError.set('No se pudo conectar con el servidor. Inténtalo de nuevo.');
          break;
        default:
          this.loginError.set(this.messages.errorInvalidCredentials);
      }
      return;
    }

    this.loginError.set(this.messages.errorInvalidCredentials);
  }
}
