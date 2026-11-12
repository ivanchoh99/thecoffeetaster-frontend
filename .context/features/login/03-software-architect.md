# 03. Arquitectura de Software — Login (Autenticación)

| Campo | Valor |
| :--- | :--- |
| **Feature** | `login` |
| **Fase** | MVP (Fase 1) |
| **Estado** | Especificación de arquitectura centrada exclusivamente en login |
| **Fecha** | 01/11/2026 |
| **Basado en** | `.context/features/login/01-product-manager.md` y `.context/features/login/02-ux-ui-designer.md` |

---

## 1. Visión General de la Arquitectura del Login

La arquitectura de la feature de autenticación se centra exclusivamente en el flujo de acceso (`/login`), la gestión de la sesión del usuario, la protección de rutas mediante guards y la integración reactiva con el header, utilizando **Angular (Standalone Components + Signals)**.

---

## 2. Modelos de Datos y Tipos (`src/app/core/models/auth.model.ts`)

```typescript
export interface User {
  id: string;
  email: string;
  name: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export interface BlockInfo {
  blocked: boolean;
  minutesRemaining?: number;
}

export type AuthReason = 'expired' | 'auth-required';
```

---

## 3. Servicio Core: `AuthService` (`src/app/core/services/auth.service.ts`)

Servicio centralizado que administra el estado de autenticación de forma reactiva mediante **Angular Signals**.

```typescript
import { Injectable, signal, computed } from '@angular/core';
import { User, LoginCredentials, BlockInfo } from '../models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly _currentUser = signal<User | null>(null);
  private readonly _blockInfo = signal<BlockInfo | null>(null);

  readonly currentUser = this._currentUser.asReadonly();
  readonly blockInfo = this._blockInfo.asReadonly();
  readonly isAuthenticated = computed(() => this._currentUser() !== null);

  async login(credentials: LoginCredentials): Promise<void> {
    // Envía credenciales al backend, almacena access token en memoria y gestiona refresh token en HttpOnly cookie
  }

  async logout(): Promise<void> {
    // Invalida la sesión en cliente y backend
    this._currentUser.set(null);
  }

  async refreshSession(): Promise<void> {
    // Renueva automáticamente el token y la ventana deslizante de 7 días ante actividad autenticada
  }
}
```

---

## 4. Enrutamiento, Guards y Sanitización

### 4.1 Definición de la Ruta `/login`
La ruta de autenticación se declara como componente standalone protegido por `guestGuard`:

```typescript
{ 
  path: 'login', 
  loadComponent: () => import('./page/login/login.page').then(m => m.LoginPage),
  canActivate: [guestGuard]
}
```

### 4.2 Guards Funcionales de Autenticación
- **`authGuard` (`src/app/core/guards/auth.guard.ts`)**:
  - Verifica `auth.isAuthenticated()`.
  - Si es falso, redirige a `/login` adjuntando los query params `returnUrl` (ruta solicitada) y `reason=auth-required`.
- **`guestGuard` (`src/app/core/guards/guest.guard.ts`)**:
  - Protege `/login`. Si el usuario ya está autenticado, evita mostrar el formulario y redirige a `returnUrl` válido o a `/` (**RN-19**).

### 4.3 Sanitización de `returnUrl` (`src/app/core/utils/return-url.util.ts`)
Implementa las reglas **RN-18** para garantizar seguridad frente a Open Redirect:
- Exige ruta relativa interna que inicie con `/` pero no `//`.
- Rechaza esquemas peligrosos (`javascript:`, `data:`) y URLs externas.
- Impide redirecciones circulares a `/login` o `/logout`.
- Valida contra el árbol de rutas del router; si falla, aplica fallback a `/`.

---

## 5. Seguridad, Control de Intentos y Errores

1. **Credenciales Incorrectas (RN-04):** Mensaje unificado *"Email o contraseña incorrectos"* (sin revelar si el correo existe).
2. **Bloqueo Temporal por Fuerza Bruta (RN-05):** Tras 5 intentos fallidos consecutivos, bloqueo de 15 minutos por identificador. Deshabilita temporalmente el formulario y muestra el tiempo restante.
3. **Persistencia y Expiración (RN-06):** Sesión con ventana deslizante de 7 días renovada por refresco automático.

---

## 6. Estado UI y Comportamiento de Recarga (`RN-16`)

- **Rutas Públicas:** El login o logout actualiza de forma reactiva el Header (botón "Iniciar sesión" vs. menú de usuario con "Salir") sin recargar la página.
- **Rutas Protegidas:** Si la sesión expira o se cierra sesión estando en una ruta protegida, se fuerza una recarga completa (`window.location.reload()`) para purgar estados protegidos en caché.
