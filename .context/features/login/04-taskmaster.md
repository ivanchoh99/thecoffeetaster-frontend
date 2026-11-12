# 04. Plan de Desarrollo e Implementación - Login (Autenticación)

## 1. Resumen Ejecutivo de Desarrollo

- **Módulo / Feature:** `login`
- **Archivos/Módulos Impactados:** 
  - `src/app/core/models/auth.model.ts` (Nuevo)
  - `src/app/core/services/auth.service.ts` (Nuevo)
  - `src/app/core/guards/auth.guard.ts` (Nuevo)
  - `src/app/core/guards/guest.guard.ts` (Nuevo)
  - `src/app/core/utils/return-url.util.ts` (Nuevo)
  - `src/app/page/login/login.ts` (Nuevo)
  - `src/app/page/login/login.html` (Nuevo)
  - `src/app/page/login/login.scss` (Nuevo)
  - `src/app/components/header/header.ts`, `header.html`, `header.scss` (Modificación)
  - `src/app/app.routes.ts` (Modificación)
- **Estrategia de Construcción:** 
  - **Fase 1:** Modelos de datos de autenticación y utilidad robusta de saneamiento de `returnUrl` (RN-18).
  - **Fase 2:** Servicio centralizado de autenticación (`AuthService`) con Angular Signals y Guards funcionales (`authGuard`, `guestGuard`).
  - **Fase 3:** Página de Login (`LoginPage`) con formulario reactivo, validaciones en tiempo real, manejo de estados (loading, errores, bloqueo 15 min), y actualización reactiva del Header (desktop y móvil con hamburguesa) junto con las rutas protegidas del blog (`/blog/editar`, `/blog/editar/:id`, `/blog/preview/:id`).
  - **Fase 4:** Verificación integral de flujos, criterios Gherkin, accesibilidad ARIA y comportamiento de recarga de página al cambiar de estado en rutas protegidas (RN-16).

## 2. Checklist de Desarrollo por Fases

### Fase 1: Modelos & Utilidades Core

- [ ] **TASK-01:** Crear modelo de datos y tipos de autenticación
  - **Archivos:** `src/app/core/models/auth.model.ts`
  - **Criterio de Aceptación:** Interfaces `User`, `LoginCredentials`, `AuthResponse`, `BlockInfo` y tipo `AuthReason` definidas correctamente y exportadas.
- [ ] **TASK-02:** Implementar función de sanitización y validación de `returnUrl`
  - **Archivos:** `src/app/core/utils/return-url.util.ts`
  - **Criterio de Aceptación:** Implementación estricta de RN-18 (exige ruta relativa interna que inicie con `/` pero no `//`, rechaza esquemas peligrosos como `javascript:`, URLs externas, `/login`, `/logout` y rutas inexistentes; fallback seguro a `/`).

### Fase 2: Servicio Auth, Guards y Enrutamiento

- [ ] **TASK-03:** Implementar `AuthService` con Angular Signals
  - **Archivos:** `src/app/core/services/auth.service.ts`
  - **Criterio de Aceptación:** Servicio inyectable `root` con señales reactivas `currentUser`, `blockInfo`, `isAuthenticated`, y métodos `login()`, `logout()` y `refreshSession()`.
- [ ] **TASK-04:** Implementar `authGuard` y `guestGuard`
  - **Archivos:** `src/app/core/guards/auth.guard.ts`, `src/app/core/guards/guest.guard.ts`
  - **Criterio de Aceptación:** `authGuard` verifica sesión y redirige a `/login` con `returnUrl` y `reason=auth-required` si no existe. `guestGuard` verifica sesión activa en `/login` y redirige a `returnUrl` o home (RN-19).
- [ ] **TASK-05:** Actualizar configuración de rutas (`app.routes.ts`) con precedencia y rutas protegidas
  - **Archivos:** `src/app/app.routes.ts`
  - **Criterio de Aceptación:** Inclusión de `/login`, rutas protegidas del blog (`/blog/editar`, `/blog/editar/:id`, `/blog/preview/:id`) con precedencia estricta antes de `/blog/:slug` (RN-22) y comodín `**` al final.

### Fase 3: Frontend UI (LoginPage & Header)

- [ ] **TASK-06:** Crear componente `LoginPage` (TS, HTML, SCSS)
  - **Archivos:** `src/app/page/login/login.ts`, `src/app/page/login/login.html`, `src/app/page/login/login.scss`
  - **Criterio de Aceptación:** Formulario reactivo con email y contraseña, validación en tiempo real (botón deshabilitado hasta email válido y password no vacío), gestión de avisos (`expired`, `auth-required`), errores de credenciales (RN-04) y bloqueo temporal de 15 min (RN-05) respetando la guía de estilo (`docs/GUIA-ESTILO.md`).
- [ ] **TASK-07:** Actualizar `HeaderComponent` para soportar estados de autenticación (Desktop y Móvil)
  - **Archivos:** `src/app/components/header/header.ts`, `src/app/components/header/header.html`, `src/app/components/header/header.scss`
  - **Criterio de Aceptación:** Header muestra botón "Iniciar sesión" sin sesión, o nombre de usuario + menú desplegable con opción "Salir" con sesión. Soporte responsive (hamburguesa en móvil). Actualización reactiva sin recarga en rutas públicas y recarga completa en rutas protegidas (RN-16).

### Fase 4: Pruebas & Verificación Final

- [ ] **TASK-08:** Validar escenarios Gherkin, manejo de errores, accesibilidad y recarga de estado
  - **Archivos:** Revisión general del módulo de login y guards.
  - **Criterio de Aceptación:** Cumplimiento del 100% de los criterios Gherkin de HU-01, HU-02, HU-03 y HU-04 (incluyendo accesibilidad ARIA, prevención de doble envío y seguridad en redirecciones).

## 3. Matriz de Dependencias de Tareas

```text
TASK-01 (Auth Model) ──► TASK-02 (returnUrl Util) ──► TASK-03 (AuthService) ──► TASK-04 (Guards)
                                                                                  │
                                                                                  ▼
TASK-06 (LoginPage UI) ◄── TASK-05 (App Routes) ◄─────────────────────────────────┘
       │
       ▼
TASK-07 (Header UI & States) ──► TASK-08 (QA & Validation)
```
