/**
 * Microcopy centralizado en español (RN-12, RN-21).
 * Se mantiene aquí para poder reutilizarlo en Fase 2 con i18n.
 */
export const AUTH_MESSAGES = {
  title: 'Iniciar sesión',
  labelEmail: 'Email',
  labelPassword: 'Contraseña',
  submit: 'Iniciar sesión',
  submitting: 'Iniciando sesión...',
  errorInvalidEmail: 'Introduce un email válido',
  errorEmptyPassword: 'Introduce tu contraseña',
  errorInvalidCredentials: 'Email o contraseña incorrectos',
  errorBlocked: 'Demasiados intentos fallidos. Vuelve a intentarlo en 15 minutos',
  errorBlockedRemaining: (minutes: number) =>
    `Demasiados intentos fallidos. Vuelve a intentarlo en ${minutes} ${
      minutes === 1 ? 'minuto' : 'minutos'
    }`,
  noticeExpired: 'Tu sesión ha expirado. Inicia sesión de nuevo',
  noticeAuthRequired: 'Inicia sesión para continuar',
  headerLogin: 'Iniciar sesión',
  headerLogout: 'Salir',
  headerUserMenuLabel: 'Menú de usuario',
} as const;
