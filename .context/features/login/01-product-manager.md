# 01. Especificación de Producto (PM) — Login (Autenticación)

| Campo | Valor |
| :--- | :--- |
| **Feature** | `login` |
| **Fase** | MVP (Fase 1) |
| **Estado** | Especificación cerrada — lista para fase de arquitectura |
| **Fecha** | 31/10/2026 |
| **Idioma** | Español (sin i18n multiidioma en MVP) |
| **Dependencia** | API de autenticación aún no existente; su contrato se define en la fase de arquitectura |

---

## 1. Visión y Objetivo de la Funcionalidad

- **Descripción:** Incorporar autenticación con **email y contraseña** en The Coffee Taster mediante una ruta dedicada `/login` y un punto de acceso en el header, protegiendo las rutas de **edición** y **preview** del blog.
- **Problema que resuelve:** El sitio es hoy completamente público (`app.routes.ts` solo expone la home y un wildcard): no existe forma de identificar a la persona que edita o previsualiza contenido, ni de impedir que cualquiera con la URL acceda a las herramientas de edición.
- **Objetivo de negocio:** Establecer la base de identidad (sesión + estado autenticado) sobre la que se construirán en fases posteriores el registro, la recuperación de contraseña y los permisos por rol.
- **Objetivo de experiencia:** Un login de una sola pantalla, coherente con la estética editorial de `docs/GUIA-ESTILO.md` (paleta cálida, tipografía Fraunces/Inter, bordes finos, sin sombras), con feedback claro, sin filtrar información de cuentas y con retorno automático al punto donde el usuario estaba.

**Alcance del MVP en una frase:** login email + contraseña, sesión con refresco automático y ventana deslizante de 7 días, protección de rutas de edición y preview, header consciente del estado y logout.

### 1.1 Preguntas de clarificación resueltas

| # | Tema | Pregunta | Decisión confirmada |
| :-- | :--- | :--- | :--- |
| 1 | Alcance | ¿Solo login o también registro/recuperación? | **Solo login + logout.** Registro, recuperación, verificación de email y OAuth → Fase 2. |
| 2 | Método | ¿Qué métodos de autenticación? | **Email + contraseña**, único método del MVP. |
| 3 | Backend | ¿Existe API de autenticación? | **No existe.** El contrato se define en arquitectura; esta HU describe comportamiento, no endpoints. |
| 4 | Roles | ¿Hay RBAC de permisos? | **No.** Solo dos estados: `usuario sin registrar` y `usuario registrado`. Sin roles admin/editor/autor. |
| 5 | Contraseña | ¿Política de contraseña? | Mínimo **12 caracteres** con al menos una mayúscula, una minúscula, un número y un símbolo. Sin expiración ni historial en MVP. |
| 6 | Error de credenciales | ¿Mensaje ante fallo? | Genérico: **"Email o contraseña incorrectos"**. Nunca revelar si el email existe. |
| 7 | Bloqueo | ¿Intentos fallidos? | **5 fallos consecutivos → bloqueo temporal de 15 minutos.** |
| 8 | Sesión | ¿Cómo se mantiene? | **Refresco automático de sesión**: cada refresco reinicia una ventana deslizante de **7 días**. Si pasan 7 días sin refrescar, la sesión se cierra. |
| 9 | Expiración | ¿Comportamiento al expirar? | Redirigir a `/login` **conservando el deep link** para volver tras autenticarse y mostrando un aviso. |
| 10 | Post-login | ¿Destino tras login? | Deep link si existía; en caso contrario, **home**. |
| 11 | Rutas protegidas | ¿Cuáles requieren sesión? | **Edición y preview del blog.** Home y blog público quedan abiertos. |
| 12 | Header | ¿Qué muestra? | Sin sesión: botón de acceso. Con sesión: **nombre del usuario + menú desplegable con "Salir"**. |
| 13 | Logout | ¿Comportamiento? | Cierra la sesión, vuelve al estado "sin registrar" y redirige a **home**. |
| 14 | Idioma | ¿i18n? | **Solo español**, sin multiidioma en MVP. |
| 15 | UI | ¿Dónde vive el login? | Ruta dedicada **`/login`** + botón en el header, reutilizando la estética de `docs/GUIA-ESTILO.md`. |
| 16 | Validación del formulario | ¿Cuándo se habilita el botón de envío? | El botón permanece **deshabilitado** hasta que el email tenga formato válido y la contraseña no esté vacía. |
| 17 | "Recordarme" | ¿Se mantiene la opción? | **Eliminada.** La sesión siempre se refresca automáticamente. |
| 18 | Caducidad del refresco | ¿Qué pasa al superar la ventana? | Se cierra la sesión y, al solicitar una ruta protegida, se redirige a `/login` con deep link y aviso (RN-23). |
| 19 | Recarga al cambiar de estado | ¿Cuándo se recarga la página completa? | Si el cambio de estado de autenticación ocurre estando en una **ruta protegida**, se fuerza recarga completa. En rutas públicas el header se actualiza sin recarga. |
| 20 | Retorno desde el header | ¿A dónde vuelve un login iniciado en una ruta pública? | A la **ruta actual**; si no es una ruta interna válida, a **home** (RN-20). |
| 21 | Creación de entrada | ¿Existe `/blog/editar` y se protege? | **Sí**: la creación se protege igual que `/blog/editar/:id` (RN-09, RN-22). |
| 22 | Fallback | ¿Qué hace una ruta inexistente? | **Redirect a home**. El wildcard no se usa para validar `returnUrl` (RN-25). |
| 23 | Avisos de `/login` | ¿Cómo se transporta el aviso? | Query `reason`: **`expired`** o **`auth-required`**; cualquier otro valor se ignora (RN-21). |

### 1.2 Inventario de rutas de la feature

> **Decisión de completitud:** este inventario fija el contrato de navegación del MVP. Hoy en `app.routes.ts` solo existen `/` y `**`; las rutas del blog se incorporarán con su propia feature (ver S-10). Toda ruta que pueda ser origen o destino de un deep link debe figurar aquí (RN-17).

| Path | Tipo | Guard | Propósito | Params / Query | Redirección y comportamiento |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/` | Pública | — | Home | — | Sin redirección. Destino por defecto tras login sin `returnUrl` (RN-08). |
| `/login` | Pública (solo invitados) | `guestGuard` | Formulario de acceso (HU-01) | `returnUrl` (opcional, ruta interna), `reason` (`expired` \| `auth-required`) | Si el usuario ya está autenticado → `returnUrl` válido o `/` (RN-19). Tras login → `returnUrl` válido o `/`. |
| `/blog` | Pública | — | Índice del blog; origen de deep link | — | Sin redirección. El login iniciado aquí vuelve a `/blog` (RN-20). |
| `/blog/:slug` | Pública | — | Detalle de una entrada; origen de deep link | `:slug` | Sin redirección. Se declara **después** de `/blog/editar*` y `/blog/preview/:id` (RN-22). |
| `/blog/editar` | Protegida | `authGuard` | Creación de entrada (ver decisión #21) | — | Sin sesión → `/login?returnUrl=/blog/editar&reason=auth-required`. |
| `/blog/editar/:id` | Protegida | `authGuard` | Edición de entrada | `:id` | Sin sesión → `/login?returnUrl=<ruta solicitada>&reason=auth-required`. |
| `/blog/preview/:id` | Protegida | `authGuard` | Preview de entrada | `:id` | Sin sesión → `/login?returnUrl=<ruta solicitada>&reason=auth-required`. |
| `**` | Fallback | — | Ruta no encontrada | — | Redirect a `/` (comportamiento actual del router). **No** participa en la validación de `returnUrl` (RN-25). |
| `/logout` | **No existe** | — | — | — | El logout es una acción del menú del header, sin ruta propia (RN-26, HU-03). |

> El orden de las filas es descriptivo; el orden de declaración real en el router es el de RN-22.

> `docs/GUIA-ESTILO.md` documenta `/preview` (demo de editores) y `/en-construccion` (placeholder). No forman parte de este inventario; si se conectan como rutas reales, revisar RN-17 y RN-22 antes de usarlas como deep link.

---

## 2. Matriz de Roles y Permisos (RBAC)

> **Nota de alcance:** esta feature **no define un RBAC de permisos**. Los "roles" son únicamente **estados de registro/autenticación**. No existen roles de administrador, editor ni autor en el MVP; cualquier permiso adicional por rol se definirá en una feature posterior (ver §5).

| Rol / Estado | Permiso sobre esta feature | Comportamiento / Punto de Conversión |
| :--- | :--- | :--- |
| `usuario sin registrar` | Puede navegar home y blog público, abrir `/login` y solicitar una ruta protegida. **No puede** acceder a edición/preview ni ver el menú de usuario. | Al solicitar una ruta protegida → redirección a `/login` guardando el deep link. Header: botón "Iniciar sesión". Único punto de conversión: **login exitoso**. |
| `usuario registrado` | Puede todo lo anterior + acceder a edición/preview y cerrar sesión. | Header: nombre del usuario + menú con "Salir". Sesión con refresco automático y ventana deslizante de 7 días. Al caducar el refresco, el siguiente acceso a una ruta protegida → `/login` con deep link y aviso. |

**Transiciones de estado permitidas en el MVP:**

- `usuario sin registrar` → `usuario registrado`: solo mediante login exitoso con credenciales válidas.
- `usuario registrado` → `usuario sin registrar`: solo mediante logout, expiración de sesión o revocación de la sesión por el backend.
- No existe transición de alta de cuenta dentro de esta feature (ver supuesto S-01).

---

## 3. Reglas de Negocio Transversales (RN)

| ID | Regla | Detalle |
| :--- | :--- | :--- |
| RN-01 | Identificador de acceso | El login se realiza con **email**. Debe tener formato de email válido. La unicidad y el tratamiento de mayúsculas/minúsculas los garantiza el backend. |
| RN-02 | Política de contraseña | Al **definir o cambiar** contraseña: mínimo 12 caracteres, al menos 1 mayúscula, 1 minúscula, 1 número y 1 símbolo. Sin expiración ni historial en MVP. |
| RN-03 | Validación en login | En login **no** se re-valida la complejidad de la contraseña: solo se exige que no esté vacía. Una contraseña válida pero anterior a la política debe poder iniciar sesión. |
| RN-04 | Error de credenciales | Mensaje único **"Email o contraseña incorrectos"**, sin indicar qué campo falló ni si el email está registrado. |
| RN-05 | Bloqueo por intentos | Tras **5 intentos fallidos consecutivos** se bloquea el acceso **15 minutos**. Durante el bloqueo no se valida la contraseña, incluso si es correcta. El bloqueo se aplica al identificador introducido, exista o no la cuenta, para no revelar si la cuenta existe (S-03, S-11). |
| RN-06 | Refresco de sesión | La sesión se mantiene mediante un **refresh token** renovado automáticamente. Cada refresco reinicia una **ventana deslizante de 7 días**. Si transcurren 7 días sin refresco, la sesión deja de ser válida. |
| RN-07 | Expiración | Al caducar la sesión de refresco, el **siguiente acceso a una ruta protegida** redirige a `/login` conservando el deep link y mostrando el aviso "Tu sesión ha expirado. Inicia sesión de nuevo" (ver RN-23). |
| RN-08 | Deep link | Tras login, redirigir a la ruta interna solicitada (`returnUrl`). Si no existe, es inválida, es externa o apunta a `/login` → **home**. La validación se resuelve contra la configuración del router (RN-18). |
| RN-09 | Rutas protegidas | **Edición** (incluida la creación en `/blog/editar`) y **preview** del blog requieren sesión. Home y blog público quedan abiertos (ver inventario §1.2). |
| RN-10 | Logout | Invalida la sesión, incluido el refresh token, y redirige a **home**; el header vuelve al estado "sin registrar". |
| RN-11 | Estado del header | Sin sesión: botón de acceso. Con sesión: nombre + menú "Salir". Se actualiza sin recargar la página. |
| RN-12 | Idioma | Todos los textos en **español**, sin claves de i18n en el MVP. |
| RN-13 | Accesibilidad | Formulario operable por teclado y lector de pantalla: etiquetas asociadas, foco visible, errores anunciados y asociados al campo. |
| RN-14 | Estado del botón de envío | El botón "Iniciar sesión" permanece **deshabilitado** mientras el email no tenga formato válido o la contraseña esté vacía. No se muestran errores de validación mientras el usuario no haya interactuado con el campo. |
| RN-15 | Actividad que renueva la sesión | El refresco se dispara por **actividad autenticada del usuario** (navegación o peticiones a la API), no por un temporizador en segundo plano. Una pestaña abierta sin interacción no renueva la ventana de 7 días. |
| RN-16 | Recarga al cambiar de estado | Si el estado de autenticación cambia (login o logout) mientras el usuario está en una **ruta protegida**, se fuerza una **recarga completa de la página**. En rutas públicas, el header se actualiza de forma reactiva sin recarga. |
| RN-17 | Inventario de rutas | Las rutas de la feature son exactamente las del inventario §1.2. Toda ruta nueva que pueda ser origen o destino de un deep link debe añadirse al inventario y a la validación de `returnUrl` antes de usarse. |
| RN-18 | `returnUrl` seguro | Solo se aceptan paths internos que resuelvan contra una ruta declarada en el router. Se rechazan URLs absolutas, protocolo-relativas (`//`), esquemas (`javascript:`, `http:`, `https:`), dominios externos, rutas inexistentes y `/login` (para evitar bucles). El saneamiento se resuelve con el parser y la configuración del router, no por comparación de strings. Si no es válido → **home**. |
| RN-19 | Usuario autenticado en `/login` | Si un usuario con sesión activa entra en `/login`, no se muestra el formulario: se redirige a `returnUrl` válido o, en su defecto, a **home**. |
| RN-20 | Origen del `returnUrl` | El botón "Iniciar sesión" del header en una ruta pública envía `returnUrl` con la ruta actual (path + query, sin fragmento; el valor se codifica como parámetro de consulta). El guard de una ruta protegida envía la ruta protegida solicitada. En `/login` no se genera `returnUrl` (destino home). |
| RN-21 | Avisos de `/login` | El aviso se transporta en `reason`: `expired` → "Tu sesión ha expirado. Inicia sesión de nuevo"; `auth-required` → "Inicia sesión para continuar". Cualquier otro valor se ignora sin mostrar aviso. El aviso se descarta al completar el login. |
| RN-22 | Precedencia de rutas | `/blog/editar`, `/blog/editar/:id` y `/blog/preview/:id` se declaran antes que `/blog/:slug`; `**` siempre al final. Así `editar` (y cualquier ruta de dos segmentos bajo `/blog`) nunca se interpreta como `:slug`. |
| RN-23 | Expiración en ruta pública | La caducidad de la sesión no redirige ni muestra aviso si el usuario está en una ruta pública. La redirección a `/login` con `reason=expired` ocurre solo al solicitar una ruta protegida (coherente con RN-07 y RN-15). |
| RN-24 | Persistencia del deep link | `returnUrl` y `reason` viven en la query string de `/login`; por tanto sobreviven a la recarga, a abrir en otra pestaña y al botón "atrás". No se guardan solo en memoria. |
| RN-25 | Fallback y validación del retorno | `**` redirige a home y no se usa para validar `returnUrl`: una ruta inexistente no es válida aunque el wildcard la resuelva. |
| RN-26 | Logout sin ruta | No existe `/logout`. El cierre de sesión es una acción del menú del header (RN-10) que termina en redirección a home. |

---

## 4. Historias de Usuario (HUs) & Criterios de Aceptación (Gherkin)

### HU-01: Iniciar sesión con email y contraseña

**Como** usuario sin registrar
**Quiero** iniciar sesión con mi email y contraseña
**Para** acceder a las herramientas de edición y preview del blog

#### Criterios de Aceptación:

```gherkin
Escenario: Login exitoso con deep link pendiente
  Dado que el usuario sin registrar está en /login tras intentar acceder a /blog/editar/123
  Cuando introduce un email registrado y su contraseña correcta y envía el formulario
  Entonces se crea una sesión con refresco automático y ventana deslizante de 7 días
  Y es redirigido a /blog/editar/123
  Y el header muestra su nombre y el menú "Salir"

Escenario: Login exitoso sin deep link pendiente
  Dado que el usuario sin registrar abre /login directamente
  Cuando introduce credenciales válidas y envía el formulario
  Entonces se crea una sesión con refresco automático y ventana deslizante de 7 días
  Y es redirigido a la home

Escenario: Credenciales incorrectas
  Dado que existe una cuenta con el email "autor@thecoffeetaster.com"
  Cuando el usuario introduce ese email con una contraseña incorrecta
  Entonces se muestra el mensaje "Email o contraseña incorrectos"
  Y el mensaje no indica cuál de los dos campos es incorrecto
  Y no se crea sesión
  Y el usuario permanece en /login

Escenario: Email no registrado
  Dado que no existe ninguna cuenta con el email "desconocido@thecoffeetaster.com"
  Cuando el usuario introduce ese email con cualquier contraseña
  Entonces se muestra exactamente el mismo mensaje "Email o contraseña incorrectos"
  Y no se revela que el email no está registrado

Escenario: Botón de envío deshabilitado con campos vacíos
  Dado que el usuario está en /login
  Y los campos de email y contraseña están vacíos
  Entonces el botón "Iniciar sesión" está deshabilitado
  Y no se muestra ningún mensaje de error
  Y no se envía ninguna petición de autenticación

Escenario: El botón se habilita al completar datos válidos
  Dado que el usuario está en /login
  Cuando introduce un email con formato válido y una contraseña no vacía
  Entonces el botón "Iniciar sesión" se habilita
  Y al pulsarlo se envía la petición de autenticación

Escenario: Formato de email inválido
  Dado que el usuario está en /login
  Cuando introduce "autor@" en el campo email y el campo pierde el foco
  Entonces se muestra el error "Introduce un email válido"
  Y el botón "Iniciar sesión" permanece deshabilitado
  Y no se envía ninguna petición de autenticación

Escenario: Contraseña vacía mantiene el botón deshabilitado
  Dado que el usuario está en /login
  Cuando introduce un email válido y deja la contraseña vacía
  Entonces el botón "Iniciar sesión" permanece deshabilitado
  Y no se envía ninguna petición de autenticación

Escenario: Contraseña vacía no dispara la política de complejidad
  Dado que el usuario está en /login
  Cuando introduce un email válido, deja la contraseña vacía y el campo pierde el foco
  Entonces se muestra únicamente el error "Introduce tu contraseña"
  Y no se muestran mensajes sobre mayúsculas, números o símbolos

Escenario: Contraseña válida que no cumple la política vigente
  Dado un usuario registrado cuya contraseña no cumple la política actual de complejidad
  Cuando introduce su contraseña correcta en /login
  Entonces inicia sesión correctamente
  Y no se le obliga a cambiarla en este MVP

Escenario: Bloqueo tras cinco intentos fallidos
  Dado que el usuario acumula 4 intentos fallidos consecutivos
  Cuando falla un quinto intento
  Entonces la cuenta queda bloqueada temporalmente durante 15 minutos
  Y se muestra el mensaje "Demasiados intentos fallidos. Vuelve a intentarlo en 15 minutos"

Escenario: Intento de login durante el bloqueo
  Dado que la cuenta está bloqueada temporalmente
  Cuando el usuario introduce la contraseña correcta antes de que transcurran los 15 minutos
  Entonces no se crea sesión
  Y se mantiene el mensaje de bloqueo con el tiempo restante

Escenario: Intento de login con un identificador no registrado que está bloqueado
  Dado que el identificador "desconocido@thecoffeetaster.com" acumuló 5 intentos fallidos y está bloqueado temporalmente
  Cuando el usuario vuelve a enviar credenciales con ese mismo email
  Entonces se muestra el mismo mensaje de bloqueo con el tiempo restante
  Y no se revela si el email está registrado

Escenario: Fin del bloqueo
  Dado que han transcurrido los 15 minutos de bloqueo
  Cuando el usuario introduce credenciales correctas
  Entonces inicia sesión con normalidad
  Y el contador de intentos fallidos se reinicia

Escenario: Refresco automático de la sesión
  Dado que el usuario tiene una sesión activa
  Cuando el access token está próximo a caducar y el usuario sigue usando la aplicación
  Entonces la sesión se renueva automáticamente sin pedir credenciales
  Y la ventana de validez del refresco vuelve a 7 días desde ese momento

Escenario: Caducidad de la sesión de refresco
  Dado que el usuario tiene una sesión activa
  Cuando transcurren 7 días sin que se produzca ningún refresco de sesión
  Entonces la sesión deja de ser válida
  Y el siguiente acceso a una ruta protegida redirige a /login con el deep link correspondiente
  Y se muestra el aviso "Tu sesión ha expirado. Inicia sesión de nuevo"

Escenario: El formulario no ofrece "Recordarme"
  Dado que el usuario está en /login
  Entonces el formulario no muestra ninguna opción "Recordarme"
  Y la sesión siempre se gestiona con refresco automático

Escenario: Prevención de doble envío
  Dado que el usuario ha enviado el formulario con datos válidos
  Cuando la petición de autenticación está en curso
  Entonces el botón de envío se deshabilita y muestra un estado de carga
  Y un segundo clic no genera una petición adicional

Escenario: Accesibilidad del formulario
  Dado que el usuario navega con lector de pantalla y teclado
  Cuando llega a /login
  Entonces cada campo tiene una etiqueta asociada mediante label
  Y el foco inicial se sitúa en el campo de email
  Y todos los controles son operables con Tab y el formulario se envía con Enter cuando los datos son válidos
  Y el estado deshabilitado del botón se comunica a las tecnologías de asistencia
  Y el foco visible es perceptible en cada control

Escenario: Anuncio de errores de validación
  Dado que el usuario está en /login
  Cuando un campo pierde el foco con un valor inválido
  Entonces ese campo se marca con aria-invalid="true"
  Y su mensaje de error se asocia al campo con aria-describedby
  Y el mensaje de error se anuncia mediante una región aria-live
```

---

### HU-02: Conservar la sesión, respetar el mapa de rutas y volver al punto de origen

**Como** usuario registrado
**Quiero** que mi sesión se mantenga mientras trabajo y, si caduca, volver al punto donde estaba
**Para** no perder el contexto ni el trabajo de edición

#### Criterios de Aceptación:

```gherkin
Escenario: Acceso a ruta protegida sin sesión
  Dado que el usuario no tiene sesión activa
  Cuando solicita /blog/editar/123
  Entonces es redirigido a /login?returnUrl=/blog/editar/123&reason=auth-required
  Y se conserva /blog/editar/123 como deep link
  Y se muestra el aviso "Inicia sesión para continuar"

Escenario: Acceso a ruta protegida con sesión válida
  Dado que el usuario tiene una sesión activa y vigente
  Cuando solicita /blog/editar/123
  Entonces accede directamente a la ruta sin pasar por /login

Escenario: Acceso a ruta pública sin sesión
  Dado que el usuario no tiene sesión activa
  Cuando navega a la home o a una entrada pública del blog
  Entonces accede al contenido sin redirección y sin avisos de autenticación

Escenario: Caducidad de la sesión de refresco durante la navegación
  Dado que el usuario tenía sesión activa y han transcurrido 7 días sin refresco
  Cuando solicita una ruta protegida
  Entonces es redirigido a /login?returnUrl=<ruta solicitada>&reason=expired conservando la ruta solicitada como deep link
  Y se muestra el aviso "Tu sesión ha expirado. Inicia sesión de nuevo"

Escenario: Refresco transparente mientras el usuario trabaja
  Dado que el usuario está editando contenido en una ruta protegida
  Cuando el access token está próximo a caducar
  Entonces la sesión se renueva en segundo plano
  Y el usuario no pierde el contexto ni ve un aviso de sesión expirada
  Y la ventana de refresco se reinicia a 7 días

Escenario: Pestaña inactiva no renueva la sesión
  Dado que el usuario dejó la aplicación abierta en una pestaña sin interactuar
  Cuando transcurren 7 días sin actividad autenticada
  Entonces la sesión caduca aunque la pestaña siga abierta
  Y la siguiente acción que requiera sesión redirige a /login con el deep link correspondiente

Escenario: Retorno al deep link tras reautenticarse
  Dado que el usuario fue redirigido a /login con el deep link /blog/preview/123
  Cuando introduce credenciales válidas y envía el formulario
  Entonces es redirigido a /blog/preview/123
  Y el aviso de sesión expirada desaparece

Escenario: Deep link inválido o externo
  Dado que el usuario llega a /login con un deep link que apunta a un dominio externo o a una ruta inexistente
  Cuando inicia sesión correctamente
  Entonces es redirigido a la home
  Y no se produce ninguna redirección fuera del dominio de la aplicación

Escenario: Fallo del refresco de sesión
  Dado que el usuario tiene una sesión activa
  Cuando el intento de refresco es rechazado por el backend
  Entonces la sesión local se elimina
  Y el siguiente acceso a una ruta protegida redirige a /login con el deep link correspondiente
  Y se muestra el aviso "Tu sesión ha expirado. Inicia sesión de nuevo"

Escenario: Usuario autenticado abre /login
  Dado que el usuario tiene una sesión activa
  Cuando abre /login directamente
  Entonces no se muestra el formulario de acceso
  Y es redirigido a la home

Escenario: Usuario autenticado abre /login con deep link válido
  Dado que el usuario tiene una sesión activa
  Cuando abre /login?returnUrl=/blog/preview/123
  Entonces no se muestra el formulario de acceso
  Y es redirigido a /blog/preview/123

Escenario: Login desde el header en una ruta pública
  Dado que el usuario sin sesión está en /blog/mejores-cafeteras-de-especialidad
  Cuando pulsa "Iniciar sesión" en el header e inicia sesión correctamente
  Entonces es redirigido a /blog/mejores-cafeteras-de-especialidad
  Y no a la home

Escenario: El aviso de login se transporta en la URL
  Dado que el usuario sin sesión solicita /blog/editar/123
  Cuando es redirigido a /login
  Entonces la URL es /login?returnUrl=/blog/editar/123&reason=auth-required
  Y se muestra el aviso "Inicia sesión para continuar"

Escenario: Recarga de /login conserva el deep link
  Dado que el usuario está en /login?returnUrl=/blog/preview/123&reason=expired
  Cuando recarga la página
  Entonces la URL se mantiene con returnUrl=/blog/preview/123 y reason=expired
  Y el formulario sigue mostrando el aviso "Tu sesión ha expirado. Inicia sesión de nuevo"

Escenario: Deep link manipulado hacia un dominio externo
  Dado que el usuario llega a /login con returnUrl=https://sitio-externo.example
  Cuando inicia sesión correctamente
  Entonces es redirigido a la home
  Y no se produce ninguna navegación fuera del dominio de la aplicación

Escenario: Deep link manipulado con esquema peligroso
  Dado que el usuario llega a /login con returnUrl=javascript:alert(1)
  Cuando inicia sesión correctamente
  Entonces es redirigido a la home
  Y no se ejecuta ningún script ni se produce navegación externa

Escenario: Deep link protocolo-relativo
  Dado que el usuario llega a /login con returnUrl=//sitio-externo.example
  Cuando inicia sesión correctamente
  Entonces es redirigido a la home
  Y no se produce ninguna navegación fuera del dominio de la aplicación

Escenario: Deep link hacia una ruta inexistente
  Dado que el usuario llega a /login con returnUrl=/ruta/que-no-existe
  Cuando inicia sesión correctamente
  Entonces es redirigido a la home
  Y no se muestra una página de error

Escenario: Deep link hacia /login
  Dado que el usuario llega a /login con returnUrl=/login
  Cuando inicia sesión correctamente
  Entonces es redirigido a la home
  Y no se produce un bucle de redirección

Escenario: Acceso sin sesión a la creación de entrada
  Dado que el usuario no tiene sesión activa
  Cuando solicita /blog/editar
  Entonces es redirigido a /login?returnUrl=/blog/editar&reason=auth-required
  Y se conserva /blog/editar como deep link

Escenario: Ruta inexistente en el sitio
  Dado que el usuario solicita /ruta/que-no-existe
  Cuando la ruta no coincide con ninguna ruta declarada
  Entonces es redirigido a la home
  Y si esa ruta se usa como returnUrl, no se considera válida

Escenario: Edición y preview no se interpretan como slug
  Dado que el usuario con sesión activa solicita /blog/editar o /blog/editar/123
  Cuando el router resuelve la ruta
  Entonces carga la pantalla de creación o edición respectivamente
  Y no el detalle público del blog con slug "editar"
  Y /blog/preview/123 carga la pantalla de preview

Escenario: Expiración con el usuario en una ruta pública
  Dado que el usuario está en /blog con una sesión caducada
  Cuando la aplicación detecta la caducidad o el usuario recarga la página
  Entonces no es redirigido a /login ni ve el aviso de sesión expirada
  Y el header pasa al estado "sin registrar" sin recarga forzada
  Y la redirección con aviso solo ocurre si solicita una ruta protegida
```

---

### HU-03: Cerrar sesión

**Como** usuario registrado
**Quiero** cerrar mi sesión desde el menú de usuario
**Para** dejar la plataforma en un estado seguro cuando termino

#### Criterios de Aceptación:

```gherkin
Escenario: Logout desde el menú de usuario
  Dado que el usuario tiene una sesión activa
  Cuando selecciona "Salir" en el menú del header
  Entonces la sesión se invalida
  Y es redirigido a la home
  Y el header muestra el botón "Iniciar sesión" en lugar del menú de usuario

Escenario: Logout desde una ruta protegida
  Dado que el usuario tiene una sesión activa y está en una ruta protegida
  Cuando selecciona "Salir" en el menú del header
  Entonces la sesión se invalida
  Y se recarga la página completa
  Y es redirigido a la home
  Y el header muestra el botón "Iniciar sesión" en lugar del menú de usuario

Escenario: Logout con sesión ya expirada
  Dado que la sesión del usuario ya ha expirado
  Cuando selecciona "Salir"
  Entonces el resultado es el mismo: sesión inválida, redirección a home y header en estado "sin registrar"
  Y no se muestra ningún error al usuario

Escenario: Intento de volver atrás tras el logout
  Dado que el usuario cerró sesión
  Cuando usa el botón "atrás" del navegador para volver a una ruta protegida
  Entonces la aplicación revalida la sesión
  Y redirige a /login conservando esa ruta como deep link
  Y no muestra contenido protegido almacenado en caché
```

---

### HU-04: Header coherente con el estado de autenticación

**Como** visitante del sitio
**Quiero** ver en el header la acción correcta según mi estado
**Para** saber si he iniciado sesión y cómo acceder o salir

#### Criterios de Aceptación:

```gherkin
Escenario: Header para usuario sin registrar
  Dado que el usuario no tiene sesión activa
  Cuando carga cualquier página pública
  Entonces el header muestra el botón "Iniciar sesión"
  Y no muestra nombre de usuario ni menú desplegable

Escenario: Header para usuario registrado
  Dado que el usuario tiene una sesión activa
  Cuando carga cualquier página
  Entonces el header muestra el nombre del usuario
  Y muestra un menú desplegable que contiene la opción "Salir"
  Y no muestra el botón "Iniciar sesión"

Escenario: Actualización del header sin recargar en rutas públicas
  Dado que el usuario está en una ruta pública
  Cuando completa un login o un logout
  Entonces el header refleja el nuevo estado sin requerir recarga completa de la página

Escenario: Recarga completa al cambiar de estado en una ruta protegida
  Dado que el usuario está en una ruta protegida
  Cuando cambia su estado de autenticación por un login o un logout
  Entonces se recarga la página completa
  Y el header refleja el nuevo estado tras la recarga
  Y no se muestra contenido protegido correspondiente al estado anterior

Escenario: Nombre de usuario largo
  Dado que el nombre del usuario supera el ancho disponible en el header
  Cuando se renderiza el header
  Entonces el nombre se trunca visualmente con elipsis
  Y el nombre completo sigue siendo accesible para lectores de pantalla

Escenario: Operación del menú de usuario por teclado
  Dado que el usuario navega con teclado
  Cuando sitúa el foco en el menú de usuario y pulsa Enter o Espacio
  Entonces el menú se abre
  Y las opciones son navegables con las flechas
  Y el menú se cierra con Escape devolviendo el foco al disparador
```

---

### 4.5 Mapa de cobertura de los criterios solicitados

| Caso requerido | HU / Escenario |
| :--- | :--- |
| 1. Login exitoso con deep link | HU-01 · "Login exitoso con deep link pendiente" |
| 2. Login exitoso sin deep link | HU-01 · "Login exitoso sin deep link pendiente" |
| 3. Credenciales incorrectas | HU-01 · "Credenciales incorrectas" y "Email no registrado" |
| 4. Campos vacíos / email inválido | HU-01 · "Botón de envío deshabilitado con campos vacíos", "El botón se habilita al completar datos válidos", "Formato de email inválido" y "Contraseña vacía mantiene el botón deshabilitado" |
| 5. Política de contraseña | HU-01 · "Contraseña vacía no dispara la política de complejidad" y "Contraseña válida que no cumple la política vigente" + RN-02/RN-03 |
| 6. Bloqueo tras 5 intentos | HU-01 · "Bloqueo tras cinco intentos fallidos", "Intento de login durante el bloqueo", "Fin del bloqueo" |
| 7. Refresco de sesión / caducidad a los 7 días | HU-01 · "Refresco automático de la sesión" y "Caducidad de la sesión de refresco"; HU-02 · "Caducidad de la sesión de refresco durante la navegación", "Refresco transparente mientras el usuario trabaja" y "Pestaña inactiva no renueva la sesión" |
| 8. Expiración + deep link | HU-02 · "Caducidad de la sesión de refresco durante la navegación" y "Retorno al deep link tras reautenticarse" |
| 9. Ruta protegida sin sesión | HU-02 · "Acceso a ruta protegida sin sesión" |
| 10. Logout y header | HU-03 · "Logout desde el menú de usuario" y "Logout desde una ruta protegida" |
| 11. Botón login vs menú de usuario | HU-04 · "Header para usuario sin registrar", "Header para usuario registrado", "Actualización del header sin recargar en rutas públicas" y "Recarga completa al cambiar de estado en una ruta protegida" |
| 12. Accesibilidad básica | HU-01 · "Accesibilidad del formulario" y "Anuncio de errores de validación"; HU-04 · "Operación del menú por teclado" |
| 13. Inventario de rutas, precedencia y fallback | §1.2 + HU-02 · "Ruta inexistente en el sitio" y "Edición y preview no se interpretan como slug" |
| 14. Usuario autenticado en `/login` | HU-02 · "Usuario autenticado abre /login" y "Usuario autenticado abre /login con deep link válido" |
| 15. Origen del `returnUrl` desde el header | HU-02 · "Login desde el header en una ruta pública" |
| 16. `returnUrl` manipulado o inexistente | HU-02 · "Deep link manipulado hacia un dominio externo", "Deep link manipulado con esquema peligroso", "Deep link protocolo-relativo", "Deep link hacia una ruta inexistente" y "Deep link hacia /login" |
| 17. Recarga de `/login` con deep link | HU-02 · "Recarga de /login conserva el deep link" |
| 18. Avisos y expiración en ruta pública | HU-02 · "El aviso de login se transporta en la URL", "Acceso sin sesión a la creación de entrada" y "Expiración con el usuario en una ruta pública" |

---

## 5. Fuera de Alcance / Backlog Futuro (Fase 2)

| ID | Elemento | Motivo / Nota |
| :--- | :--- | :--- |
| BF-01 | **Registro de nuevos usuarios** | Fuera del MVP. Requiere definir alta de cuenta, verificación y aceptación de términos. |
| BF-02 | **Recuperación de contraseña** ("¿Olvidaste tu contraseña?") | Fuera del MVP. Requiere flujo por email con token y caducidad. |
| BF-03 | **Verificación de email** | Fuera del MVP. |
| BF-04 | **OAuth / login social** (Google, etc.) | Fuera del MVP. |
| BF-05 | **2FA / segundo factor** | Fuera del MVP. |
| BF-06 | **CAPTCHA / anti-bot** | No requerido en MVP; reevaluar si aparecen ataques de fuerza bruta. |
| BF-07 | **Gestión de sesiones y dispositivos** (ver sesiones activas, revocar dispositivos) | Fuera del MVP. |
| BF-08 | **i18n multiidioma** | Solo español en MVP. |
| BF-09 | **RBAC de permisos** (admin, editor, autor) | Esta feature solo distingue estados de autenticación. |
| BF-10 | **Perfil de usuario y cambio de contraseña** | Fuera del MVP; la política RN-02 se aplicará allí. |
| BF-11 | **Auditoría visible de inicios de sesión** | Solo logging interno si arquitectura lo requiere. |

---

## 6. Supuestos Explícitos

Los siguientes puntos **no fueron confirmados** por el usuario y se registran como supuestos para validar en arquitectura o con negocio.

| ID | Supuesto | Impacto si es incorrecto |
| :--- | :--- | :--- |
| S-01 | En el MVP las cuentas se crean por un proceso manual/administrativo fuera de esta feature (no hay registro público). | Sin alta de cuentas, el login no tendría usuarios; habría que adelantar el registro a Fase 1. |
| S-02 | Tras un error de credenciales se conserva el email introducido y se limpia el campo de contraseña. | Cambia el criterio de "Credenciales incorrectas". |
| S-03 | El bloqueo de 15 minutos se aplica por identificador (email) y, adicionalmente, por IP; la clave exacta se decide en arquitectura. | Afecta a la seguridad y a los escenarios de bloqueo. |
| S-04 | El contador de intentos fallidos se reinicia tras un login exitoso y al cumplirse los 15 minutos de bloqueo. | Afecta a "Fin del bloqueo". |
| S-05 | El access token tiene una vigencia corta (p. ej. 15 minutos) y se renueva de forma transparente; la duración exacta se decide en arquitectura. | Afecta a la frecuencia de refresco y a la experiencia, no a la ventana de 7 días. |
| S-06 | El deep link se transporta como parámetro de consulta en `/login` y solo admite rutas internas relativas. | Afecta a la seguridad (open redirect) y al contrato de rutas. |
| S-07 | El nombre mostrado en el header es el nombre del perfil; si no existe, se usa la parte local del email. | Cambia el criterio del header. |
| S-08 | El logout invalida la sesión también en el backend, no solo en el cliente. | Si solo fuera cliente, el escenario "volver atrás" no sería fiable. |
| S-09 | No se incluye "mostrar/ocultar contraseña" ni autocompletado explícito más allá del nativo del navegador. | Añadiría criterios de accesibilidad y UI. |
| S-10 | Los paths del blog (`/blog`, `/blog/:slug`, `/blog/editar`, `/blog/editar/:id`, `/blog/preview/:id`) se confirman en arquitectura y en la feature del blog; hoy no existen en `app.routes.ts`. El inventario §1.2 es el contrato objetivo. | Cambian los ejemplos de deep link y el orden de declaración de rutas, no las reglas. |
| S-11 | El aviso de bloqueo no confirma la existencia de la cuenta, aunque revela que el identificador está bloqueado. | Riesgo de enumeración parcial; a revisar en arquitectura/seguridad. |
| S-12 | Se aplica un nivel básico de WCAG 2.1 AA al formulario y al menú, sin auditoría formal en el MVP. | Podría requerir criterios adicionales. |

---

## 7. Dependencias y Notas para la Fase de Arquitectura

- **Contrato de API pendiente:** login, logout, validación/renovación de sesión y respuesta de error genérica. Esta especificación es independiente del transporte.
- **Almacenamiento y refresco de sesión:** decidir cookie `httpOnly` + `SameSite` frente a token en memoria con refresh, y si el refresh token rota en cada uso. La ventana deslizante de 7 días debe validarse en servidor, no solo en cliente. Impacta en S-05, S-06 y S-08.
- **Protección de rutas en Angular:** dos guards funcionales — `authGuard` en las rutas protegidas del inventario §1.2 y `guestGuard` en `/login` —, con persistencia del deep link y saneamiento de `returnUrl` resuelto contra la configuración del router (RN-18). Declarar las rutas en el orden de RN-22 y mantener `**` al final.
- **Estado de autenticación en el cliente:** señal/servicio único que alimente header, guards y redirecciones sin recargas.
- **Rate limiting y bloqueo:** definir clave (email, IP, ambas) y si el bloqueo es por cuenta o por origen.
- **Mensajes:** centralizar los textos en español (error genérico, bloqueo, sesión expirada, aviso de login requerido) para reutilizarlos en Fase 2 con i18n.
- **Estética:** el formulario y el menú deben reutilizar los tokens de `docs/GUIA-ESTILO.md`; evitar introducir un cuarto sistema de tokens.
- **Analítica (opcional, no confirmada):** eventos de login exitoso, login fallido y logout para medir conversión; no forma parte de los criterios de aceptación.
