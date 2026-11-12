import { Router, Routes } from '@angular/router';
import { FORBIDDEN_RETURN_PATHS } from '../models/auth.model';

/**
 * Utilidad de saneamiento y validación del parámetro `returnUrl` (RN-18).
 *
 * Solo se aceptan rutas internas relativas que resuelvan contra una ruta
 * declarada en el router. Se rechazan URLs absolutas, protocolo-relativas,
 * esquemas peligrosos (`javascript:`, `http:`, ...), dominios externos,
 * rutas inexistentes y `/login` (para evitar bucles de redirección).
 *
 * La validación se resuelve con el parser y la configuración del router,
 * no por comparación de strings (RN-18).
 */

/** Expresiones de esquema peligroso (comprobadas antes de cualquier parseo). */
const DANGEROUS_SCHEME = /^[a-z][a-z0-9+.-]*:/i;

/** Una ruta interna válida: empieza por `/` pero no por `//`. */
function isInternalPath(candidate: string): boolean {
  return candidate.startsWith('/') && !candidate.startsWith('//');
}

/** Escapa los caracteres reservados de una expresión regular. */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Convierte el `path` de una ruta del router en una expresión regular.
 * Los parámetros (`:id`) se traducen a `[^/]+`. El comodín `**` se excluye
 * porque no valida `returnUrl` (RN-25).
 */
function routePathToRegExp(routePath: string): RegExp | null {
  const normalized = routePath.replace(/^\/+/, '').replace(/\/+$/, '');
  if (normalized === '**' || normalized.includes('**')) {
    return null;
  }

  const segments = normalized === '' ? [''] : normalized.split('/');
  const pattern = segments
    .map((segment) => {
      if (segment.startsWith(':')) {
        return '[^/]+';
      }
      return escapeRegExp(segment);
    })
    .join('/');

  return new RegExp(`^${pattern}/?$`);
}

/** Aplana la configuración del router en una lista de rutas declaradas. */
export function collectDeclaredRoutes(routes: Routes, parentPath = ''): Routes {
  const flattened: Routes = [];

  for (const route of routes) {
    const fullPath = route.path
      ? `${parentPath}/${route.path}`.replace(/\/+/g, '/')
      : parentPath;

    flattened.push({ ...route, path: fullPath });

    if (route.children?.length) {
      flattened.push(...collectDeclaredRoutes(route.children, fullPath));
    }
  }

  return flattened;
}

/**
 * Indica si el path corresponde a una ruta declarada en el router
 * (excluyendo el comodín `**`).
 */
export function isDeclaredRoute(router: Router, path: string): boolean {
  const normalized = path.replace(/^\/+/, '').replace(/\/+$/, '');
  const declared = collectDeclaredRoutes(router.config);
  return declared.some((route) => {
    const regex = routePathToRegExp(route.path ?? '');
    return regex !== null && regex.test(normalized);
  });
}

/**
 * Sanea un `returnUrl` candidato.
 *
 * @returns La ruta interna válida (path + query) o `null` si no es válida.
 */
export function sanitizeReturnUrl(router: Router, raw: string | null | undefined): string | null {
  if (!raw) {
    return null;
  }

  const candidate = raw.trim();
  if (!candidate || !isInternalPath(candidate) || DANGEROUS_SCHEME.test(candidate)) {
    return null;
  }

  // Se descarta el fragmento (RN-20) y se separa el path de la query.
  const withoutFragment = candidate.split('#')[0];
  const queryIndex = withoutFragment.indexOf('?');
  const path = queryIndex === -1 ? withoutFragment : withoutFragment.slice(0, queryIndex);
  const query = queryIndex === -1 ? '' : withoutFragment.slice(queryIndex);

  const normalizedPath = path.length > 1 ? path.replace(/\/+$/, '') : path;

  if ((FORBIDDEN_RETURN_PATHS as readonly string[]).includes(normalizedPath)) {
    return null;
  }

  if (!isDeclaredRoute(router, normalizedPath)) {
    return null;
  }

  return `${normalizedPath}${query}`;
}

/**
 * Construye el `returnUrl` de una URL interna del router
 * (path + query, sin fragmento) — RN-20.
 */
export function toInternalReturnUrl(url: string): string {
  const withoutFragment = url.split('#')[0];
  return withoutFragment;
}
