import { PROTECTED_PATH_PREFIXES } from '../models/auth.model';

/**
 * Indica si una URL corresponde a una ruta protegida (RN-09).
 *
 * Se usa para decidir cuándo forzar una recarga completa de la página al
 * cambiar el estado de autenticación (RN-16).
 */
export function isProtectedPath(url: string): boolean {
  const path = url.split('?')[0].split('#')[0];
  return PROTECTED_PATH_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}
