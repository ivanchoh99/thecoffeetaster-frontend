# Mock API de autenticación

Servidor local que implementa el contrato de autenticación de TheCoffeeTaster
(`src/app/core/api/auth-api.ts`) para poder desarrollar y probar el frontend
sin backend.

## Uso

```bash
pnpm mock:api     # http://127.0.0.1:3000
pnpm start        # en otra terminal: http://localhost:4200
```

El proxy de desarrollo (`proxy.conf.json`) reenvía las peticiones `/api/*` del
servidor de Angular al mock, de modo que la app usa las mismas rutas relativas
que en producción.

Variables de entorno opcionales:

| Variable | Por defecto | Descripción |
| :--- | :--- | :--- |
| `MOCK_API_PORT` | `3000` | Puerto del mock |
| `MOCK_API_HOST` | `127.0.0.1` | Interfaz de escucha |

## Usuarios seed

| Email | Contraseña | Nombre |
| :--- | :--- | :--- |
| `autor@thecoffeetaster.com` | `Cafe#Segur0!2026` | Iván Carvajal |
| `editor@thecoffeetaster.com` | `Prensa#Cafe2026!` | Editor de prueba |

## Endpoints

| Método | Ruta | Respuesta |
| :--- | :--- | :--- |
| `POST` | `/api/auth/login` | `{ user, accessToken }` + cookie `httpOnly` · `401` credenciales inválidas · `429` bloqueado |
| `POST` | `/api/auth/refresh` | `{ user, accessToken }` + cookie renovada · `401` sesión no válida |
| `POST` | `/api/auth/logout` | `204` (invalida el refresh token) |
| `GET` | `/api/auth/me` | `{ user }` · `401` |
| `GET` | `/api/health` | `{ status: 'ok' }` |

Cuerpo del login:

```json
{ "email": "autor@thecoffeetaster.com", "password": "Cafe#Segur0!2026" }
```

## Reglas replicadas

- **Credenciales incorrectas (RN-04):** respuesta `401` con mensaje genérico;
  nunca revela si el email está registrado.
- **Bloqueo por intentos (RN-05):** 5 intentos fallidos consecutivos bloquean el
  identificador durante 15 minutos. El bloqueo se aplica al identificador
  introducido (exista o no la cuenta), de modo que un fallo no revela si el
  email está registrado (S-03, S-11). Además existe un bloqueo por IP con
  umbral más alto (20 intentos) como red de seguridad contra fuerza bruta.
- **Ventana deslizante (RN-06):** el refresh token viaja en una cookie `httpOnly`
  (`SameSite=Strict`) con 7 días de vigencia; cada refresco reinicia la
  ventana.

## Nota

Este mock es solo para desarrollo. En producción las cuentas se crean por un
proceso manual fuera de la aplicación (supuesto S-01) y el backend real
implementa este mismo contrato.

El estado vive en memoria: al reiniciar el servidor se pierden las sesiones,
los bloqueos y los tokens emitidos.
