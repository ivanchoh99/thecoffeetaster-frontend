# Guía de estilo y trazabilidad visual — TheCoffeeTaster

> **Snapshot de referencia:** commit `6d7d0a9` — `content(home): update footer tagline` (29/10/2026).
> **Alcance:** tema visual del frontend: paleta, tipografía, layout, componentes, responsive y accesibilidad.
> **Fuentes analizadas:** `src/styles.scss`, `src/_theme-colors.scss`, SCSS de páginas y componentes, `src/index.html`, `angular.json` y `package.json`.
> **Nota:** el `README.md` actual es el scaffold genérico de Angular CLI y no describe el tema. Este documento cubre ese vacío.

---

## 1. Resumen ejecutivo

TheCoffeeTaster usa una identidad **editorial-cafetera**: fondo papel cálido, tinta café, acento dorado y una banda oscura color espresso. La página **Home** es la referencia canónica del estilo; Blog, Preview y Building son variantes que reutilizan la paleta global, pero no todos los patrones tipográficos.

Características principales:

- **Paleta:** marrones cálidos (`#4a2c17`, `#6f4e37`), dorado (`#c9a227`) y cremas (`#f9f2e4`, `#f5ede0`).
- **Tipografía:** `Fraunces` para display/títulos y `Inter` para cuerpo en Home. Material declara `Roboto`, pero **Roboto no se carga** en `index.html`.
- **Layout:** editorial asimétrico `0.72fr / 1.28fr`, contenedor máximo de `78rem`, tarjetas planas con borde fino y radio de `12px`.
- **Estética:** bordes de `1px`, sin sombras en tarjetas, botones rectangulares, etiquetas tipo píldora y mucho espacio en blanco.
- **Riesgo principal:** conviven **tres sistemas de tokens** (Material `--mat-sys-*`, marca global `--brand-*` y tokens locales de Home `--paper`, `--ink`, etc.). Esto dificulta la consistencia y la replicabilidad exacta.

---

## 2. Inventario de fuentes de estilo

| Archivo | Rol | Líneas | Estado |
|---|---|---:|---|
| `src/index.html` | Carga de fuentes, título, metadatos | 22 | Vigente |
| `src/styles.scss` | Tema Material global + tokens `--brand-*` | 69 | Vigente |
| `src/_theme-colors.scss` | Paletas Material 3 generadas desde seeds | 205 | Generado, no editar a mano |
| `src/app/page/home/home.scss` | Estilo canónico editorial de la landing | 502 | Vigente |
| `src/app/page/home/home.html` | Estructura semántica de la landing | 128 | Vigente |
| `src/app/components/header/header.scss` | Cabecera sticky y wordmark | 53 | Vigente, con valores hardcodeados |
| `src/app/components/navbar/navbar.scss` | Navegación Material | 24 | Definido, sin renderizar en ninguna página |
| `src/app/page/blog-post/blog-post.scss` | Artículo de blog | 267 | Vigente |
| `src/app/page/preview/preview.scss` | Demo de editores | 214 | Vigente |
| `src/app/page/building/building.scss` | Página “en construcción” | 230 | Vigente |
| `src/app/shared/editor-blocks/*.ts` | Estilos inline de bloques del editor | 4 archivos | Vigente |
| `src/app/page/maintenance/maintenance.*` | Placeholder sin ruta | 1 | Huérfano |
| `src/app/app.scss` | Sin estilos | 0 | Vacío |

---

## 3. Arquitectura del tema

El tema se construye en tres capas:

```text
index.html
  └─ Fuentes: Fraunces + Inter + Material Icons
       │
_theme-colors.scss  (generado)
  └─ $primary-palette / $tertiary-palette  (Material 3)
       │
styles.scss
  ├─ @include mat.theme(...)  → variables --mat-sys-*
  └─ :root { --brand-* }      → paleta de marca
       │
Componentes SCSS
  ├─ Home:      tokens locales --paper / --ink / --gold ...
  ├─ Blog:      --brand-* + --mat-sys-*
  ├─ Preview:   --brand-* + --mat-sys-*
  ├─ Building:  --brand-* + rgba()
  └─ Navbar:    --mat-sys-*
```

### 3.1 Configuración Material

`src/styles.scss:5-16` aplica el tema a `html`:

```scss
html {
  @include mat.theme((
    color: (
      theme-type: light,
      primary: theme.$primary-palette,
      tertiary: theme.$tertiary-palette,
    ),
    typography: Roboto,
    density: 0,
  ));
}
```

- `theme-type: light`: no hay tema oscuro activo.
- `primary` y `tertiary` son paletas completas generadas.
- `secondary` no se pasa porque `$primary-palette` ya lo incorpora mediante `map.merge` en `_theme-colors.scss:129-137`.
- `typography: Roboto` genera variables `--mat-sys-*` con familia Roboto, pero **la fuente no se descarga** en `index.html`.
- `density: 0` mantiene las densidades por defecto de Material.

### 3.2 Seeds de la paleta

`src/_theme-colors.scss:7` documenta los seeds:

| Rol | Seed | Uso |
|---|---|---|
| Primary | `#4A2C17` | Espresso; base de la marca |
| Secondary | `#C9A227` | Dorado |
| Tertiary | `#C8A06A` | Latte |
| Neutral | `#EFE0C2` | Crema / superficies |
| Neutral variant | `#FBF0D9` | Vainilla / bordes suaves |

Para regenerar:

```bash
ng generate @angular/material:theme-color
```

> El archivo generado advierte “Proceed with caution if making changes”. La fuente de verdad son los seeds, no los valores individuales.

---

## 4. Tokens de diseño

### 4.1 Paleta de marca global (`--brand-*`)

Definida en `src/styles.scss:18-50`. Es global y está disponible en toda la app.

| Token | Valor | Rol semántico | Consumidores actuales | Estado |
|---|---|---|---|---|
| `--brand-espresso` | `#4a2c17` | Café espresso, fondo oscuro | Building, portada Blog, cita editor | Vigente |
| `--brand-roast` | `#5a3a22` | Tueste medio, hover | Home botón sólido, degradado Blog | Vigente |
| `--brand-toast` | `#3a2718` | Tinta tostada | Header, monograma | Vigente |
| `--brand-coffee` | `#6f4e37` | Café líquido | Café SVG de Building | Vigente |
| `--brand-cortado` | `#8c6242` | Café con leche | Sin uso | **Sin uso** |
| `--brand-latte` | `#c8a06a` | Latte | Sin uso | **Sin uso** |
| `--brand-honey` | `#e8c97a` | Miel / acento claro | Badge y texto destacado Building | Vigente |
| `--brand-dorado` | `#c9a227` | Dorado principal | Blog, Preview, editor blocks | Vigente |
| `--brand-gold` | `#ffd98a` | Dorado claro | Sin uso | **Sin uso** |
| `--brand-gold-hover` | `#ffe3a8` | Dorado hover | Sin uso | **Sin uso** |
| `--brand-arena` | `#e2c799` | Arena / bordes | Blog, Preview, editor blocks | Vigente |
| `--brand-leche` | `#efe0c2` | Leche | Sin uso | **Sin uso** |
| `--brand-tint` | `#f6ead3` | Tinte cálido | Hover menú NgxEditor | Vigente |
| `--brand-sand` | `#e5d5b3` | Arena oscura | Sin uso | **Sin uso** |
| `--brand-linen` | `#e7e0d3` | Lino | Sin uso | **Sin uso** |
| `--brand-parchment` | `#fffdf9` | Pergamino | Tabla Blog, card Preview | Vigente |
| `--brand-vainilla` | `#fbf0d9` | Vainilla | Tablas, editor, output | Vigente |
| `--brand-crema` | `#fff8eb` | Crema | Título Building | Vigente |
| `--brand-hueso` | `#f5ede0` | Hueso / fondo claro | Blog, Preview, Building, editor | Vigente |
| `--brand-ink` | `#1c1917` | Tinta principal | Títulos Blog/Preview | Vigente |
| `--brand-body` | `#292524` | Texto de cuerpo | Blog/Preview | Vigente |
| `--brand-coal` | `#201510` | Carbón | Sin uso | **Sin uso** |
| `--brand-muted` | `#57534e` | Texto secundario | Blog/Preview | Vigente |
| `--brand-soft` | `#44403c` | Texto suave | Blog/Preview/output | Vigente |
| `--brand-ochre` | `#92600f` | Ocre / labels | Categorías, tablas, editor | Vigente |
| `--brand-clay` | `#b45309` | Arcilla / enlaces | Tags, chips, “volver” | Vigente |
| `--brand-ember` | `#c2410c` | Brasa / alerta cálida | Blockquote Blog, hover enlaces | Vigente |

**Resumen:** 27 tokens declarados; **8 sin uso** (`cortado`, `latte`, `gold`, `gold-hover`, `leche`, `sand`, `linen`, `coal`). Son candidatos a eliminación o a futuras variantes.

### 4.2 Tokens locales de Home

Definidos en `src/app/page/home/home.scss:3-23`, dentro de `:host`. **Solo existen en la página Home.**

| Token | Valor | Uso | Equivalente aproximado en `--brand-*` |
|---|---|---|---|
| `--paper` | `#f9f2e4` | Fondo de página y texto de botón sólido | Entre `--brand-crema` y `--brand-vainilla` |
| `--paper-soft` | `#f1e7d5` | Fondo de la sección “Quién soy” | Sin equivalente exacto |
| `--ink` | `#2b2119` | Títulos, texto, bordes, fondo de botón | `--brand-toast` |
| `--muted` | `#6a5644` | Texto secundario | Cercano a `--brand-coffee` |
| `--line` | `#ded0b8` | Bordes y separadores | Cercano a `--brand-arena` |
| `--accent` | `#96631f` | Índices, estados, focus | Cercano a `--brand-ochre` |
| `--gold` | `#c9a227` | Línea del eyebrow | `--brand-dorado` |
| `--dark` | `#2e2118` | Fondo de la banda “A futuro” | Cercano a `--brand-coal` |
| `--dark-text` | `#f7f2e8` | Texto sobre banda oscura | Cercano a `--brand-hueso` |
| `--dark-gold` | `#d9b98a` | Eyebrow/índices sobre oscuro | Cercano a `--brand-latte` |
| `--font-display` | `'Fraunces', 'Iowan Old Style', Georgia, serif` | Títulos display | — |
| `--font-body` | `'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif` | Cuerpo | — |

> **Divergencia clave:** Home no usa `--brand-*` salvo en dos fallbacks del botón sólido (`--brand-roast`). El resto es una paleta paralela. Para unificar, se puede mapear `--paper: var(--brand-vainilla)` o mantener Home como “tema editorial” y documentarlo como variante intencional.

### 4.3 Tipografía

Fuentes cargadas en `src/index.html:12-15`:

```html
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..700;1,9..144,300..600&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
```

| Rol | Familia | Tamaño | Peso | Interlineado | Tracking | Fuente |
|---|---|---|---:|---:|---:|---|
| Cuerpo base (Material) | Roboto **no cargada** | `--mat-sys-body-medium` | 400 | Material | Material | `styles.scss:63` |
| Cuerpo Home | Inter | `1rem` | 400 | `1.7` | normal | `home.scss:33-35` |
| Hero H1 | Fraunces | `clamp(3.6rem, 10.5vw, 8.2rem)` | 400 | `0.88` | `-0.045em` | `home.scss:85-93` |
| Sección H2 | Fraunces | `clamp(2rem, 4.2vw, 3.3rem)` | 400 | `1.02` | `-0.03em` | `home.scss:190-200` |
| Subtítulo hero | Inter | `clamp(0.98rem, 0.92rem + 0.35vw, 1.12rem)` | 400 | `1.7` | normal | `home.scss:99-105` |
| Lead | Inter | `clamp(1.05rem, 1rem + 0.4vw, 1.28rem)` | 400 | `1.6` | normal | `home.scss:207-213` |
| Eyebrow | Inter | `0.66rem` | 500 | normal | `0.2em` | `home.scss:41-50` |
| Botón | Inter | `0.7rem` | 600 | normal | `0.14em` | `home.scss:120-131` |
| Título de card | Fraunces | `clamp(1.05rem, 1rem + 0.2vw, 1.2rem)` | 500 | `1.25` | normal | `home.scss:247-254` |
| Índice de card | Fraunces italic | `0.8rem` | 400 | normal | normal | `home.scss:264-269` |
| Status | Inter | `0.64rem` | 600 | normal | `0.14em` | `home.scss:271-278` |
| H1 Blog | Roboto/fallback | `clamp(1.7rem, 1.3rem + 3.4vw, 2.6rem)` | 700 (UA) | `1.12` | `-0.02em` | `blog-post.scss:32-40` |
| H2 Blog | Roboto/fallback | `clamp(1.25rem, 1.05rem + 1.4vw, 1.55rem)` | 700 (UA) | `1.25` | `-0.015em` | `blog-post.scss:107-117` |
| Wordmark header | Fraunces | `1.12rem` | 500 | normal | `-0.01em` | `header.scss:48-53` |
| Monograma header | Inter heredada | `0.7rem` | 600 | normal | `0.08em` | `header.scss:33-46` |

**Hallazgo:** `typography: Roboto` está declarado, pero Roboto no se carga. Home y el wordmark usan Fraunces/Inter; Blog, Preview y Building heredan la tipografía Material y caen al fallback del sistema. Esto rompe la replicabilidad tipográfica entre páginas.

### 4.4 Espaciado y layout

| Elemento | Valor | Fuente |
|---|---|---|
| Contenedor Home | `max-width: 78rem` | `home.scss:71`, `home.scss:181` |
| Contenedor Blog | `max-width: 44rem` | `blog-post.scss:22` |
| Contenedor Preview | `max-width: 60rem` (vía padding) | `preview.scss:12` |
| Card Building | `width: min(100%, 35rem)` | `building.scss:28` |
| Gutter horizontal Home | `clamp(1.25rem, 4vw, 3rem)` | `home.scss:74` |
| Gutter Blog/Preview | `max(1.25rem, calc((100% - 44rem/60rem) / 2))` | `blog-post.scss:12`, `preview.scss:12` |
| Padding superior hero | `clamp(3.5rem, 9vw, 7rem)` | `home.scss:73-74` |
| Padding de sección | `clamp(3.5rem, 8vw, 6.5rem) clamp(1.25rem, 4vw, 3rem)` | `home.scss:183-184` |
| Gap hero | `clamp(1.5rem, 4vw, 4rem)` | `home.scss:81` |
| Gap sección | `clamp(1.5rem, 5vw, 5rem)` | `home.scss:180` |
| Gap grid de cards | `1rem` | `home.scss:225` |
| Gap about | `clamp(1.5rem, 3.5vw, 3.5rem)` | `home.scss:290` |
| Header sticky | `min-height: 4.25rem` | `header.scss:11` |
| Navbar | `min-height: 56px` | `navbar.scss:9` |
| Footer | `padding: 1.5rem ... 2.5rem` | `home.scss:419` |

### 4.5 Radios, bordes y sombras

| Elemento | Radio | Borde | Sombra |
|---|---|---|---|
| Botones Home | `0` | `1px solid var(--ink)` | — |
| Cards Home | `12px` | `1px solid var(--line)` | `none` |
| Portada Blog | `18px` | `1px solid rgba(201,162,39,.25)` | `0 4px 16px rgba(41,37,36,.12)` |
| Tabla Blog | `12px` | `1px solid var(--brand-arena)` | — |
| Card Preview | `16px` | `1px solid var(--brand-arena)` | `0 4px 16px rgba(146,96,15,.08)` |
| Host editor JS2 | `12px` | `1px solid var(--brand-arena)` | — |
| Output Preview | `10px` | `1px solid var(--brand-arena)` | — |
| Card Building | `clamp(16px, 4vw, 24px)` | `1px solid rgba(245,237,224,.14)` | `0 24px 60px rgba(0,0,0,.45)` |
| Píldoras | `999px` | `1px solid rgba(180,83,9,.25)` | — |
| Monograma header | `50%` | `1px solid currentColor` | — |
| Retrato Home | `50%` | — | `0 18px 42px rgba(27,24,21,.22), 0 2px 6px rgba(27,24,21,.12)` |

### 4.6 Movimiento

| Elemento | Animación | Fuente |
|---|---|---|
| Botones Home | `background/border/color 0.2s ease` | `home.scss:132-135` |
| Cards Home | `background/border-color 0.2s ease` | `home.scss:238-240` |
| Vapor Building | `steam 2.6s ease-in-out infinite` | `building.scss:104-113` |
| Punto del badge | `pulse 1.6s ease-in-out infinite` | `building.scss:60-66` |
| Reduced motion | Desactiva transiciones/animaciones en Blog, Preview y Building | `blog-post.scss:264-268`, `preview.scss:211-215`, `building.scss:225-231` |

**Hallazgo:** Home no tiene bloque `prefers-reduced-motion`. Sus transiciones son sutiles, pero debería incluirlo para cumplir el mismo criterio que las demás páginas.

### 4.7 Breakpoints

| Breakpoint | Cambios |
|---|---|
| `min-width: 960px` | `.section-head` pasa a `position: sticky; top: 5.5rem` (`home.scss:438-443`) |
| `max-width: 960px` | Hero y secciones pasan a una columna; H1 baja a `clamp(3.2rem, 13vw, 6rem)` (`home.scss:445-469`) |
| `max-width: 640px` | Grid de cards a una columna; About a una columna; retrato horizontal; footer vertical (`home.scss:471-503`) |
| `max-height: 540px` + landscape | Building reduce tamaños y espaciados (`building.scss:193-223`) |

No hay tokens de breakpoint (CSS no permite custom properties en `@media`); están repetidos como literales.

---

## 5. Patrones de componentes

### 5.1 Header sticky

**Fuente:** `src/app/components/header/header.html`, `header.scss:6-53`.

```html
<mat-toolbar class="site-header">
  <a class="brand" href="/" aria-label="TheCoffeeTaster — inicio">
    <span class="monogram" aria-hidden="true">CT</span>
    <span class="wordmark">TheCoffeeTaster</span>
  </a>
</mat-toolbar>
```

Receta:

- `position: sticky; top: 0; z-index: 20`.
- `justify-content: center`.
- Fondo `rgba(249, 242, 228, 0.92)` + `backdrop-filter: blur(10px)`.
- Borde inferior `#ded0b8`.
- Monograma circular de `34px` con borde `1px`.
- Wordmark en Fraunces `1.12rem` / 500.

> **Deuda:** los colores del header están hardcodeados (`#ded0b8`, `rgba(249,242,228,.92)`, `#2b2119`) en lugar de usar `--paper`, `--line` o `--ink`.

### 5.2 Eyebrow editorial

**Fuente:** `home.scss:41-60`.

```scss
.eyebrow {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 0;
  color: var(--muted);
  font-size: 0.66rem;
  font-weight: 500;
  letter-spacing: 0.2em;
  text-transform: uppercase;

  &::before {
    flex: none;
    width: 1.75rem;
    height: 1px;
    background: var(--gold);
    opacity: 0.8;
    content: '';
  }
}
```

Se usa en Hero (`Desde cero, taza a taza`) y en cada sección (`01 — Propósito inicial`, etc.).

### 5.3 Botones

**Fuente:** `home.scss:120-157`.

- **Sólido:** fondo `--ink`, texto `--paper`, borde `--ink`; hover a `--brand-roast` y texto `#fffaf2`.
- **Ghost:** fondo transparente, borde `--line`; hover borde `--ink`.
- Ambos: `inline-flex`, `gap: 0.6rem`, padding `0.72rem 1.15rem`, radio `0`, texto `0.7rem`/600, uppercase, tracking `0.14em`.

```scss
.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.72rem 1.15rem;
  border: 1px solid var(--ink);
  border-radius: 0;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-decoration: none;
  text-transform: uppercase;
  transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease;
}
```

> En Home los botones son `<a class="btn">`. El componente Navbar existe, pero no se renderiza en ninguna página; cuando se use, sus botones Material (`matButton` filled/tonal) introducirán un segundo lenguaje visual.

### 5.4 Cards editoriales

**Fuente:** `home.scss:228-262`.

```scss
.card {
  @include mat.card-overrides((
    outlined-container-color: transparent,
    outlined-outline-color: transparent,
  ));

  padding: 1.4rem 1.4rem 1.55rem;
  border: 1px solid var(--line);
  border-radius: 12px !important;
  background: rgba(255, 253, 247, 0.5);
  box-shadow: none !important;
  transition: background 0.2s ease, border-color 0.2s ease;

  &:hover {
    border-color: #cfbfa2;
    background: rgba(201, 162, 39, 0.06);
  }
}
```

- Se usa `<mat-card appearance="outlined">`, pero se anulan contenedor y outline de Material para pintar borde propio.
- En la banda oscura cambian borde y fondo a `rgba(247,242,232,...)`.
- El `!important` es necesario para ganar a los estilos de Material; es deuda técnica a vigilar.

### 5.5 Índices, estados y etiquetas

| Patrón | Estilo | Fuente |
|---|---|---|
| Índice de card | Fraunces italic, `0.8rem`, color `--accent` | `home.scss:264-269` |
| Status | `0.64rem`, 600, uppercase, tracking `.14em`, color `--accent` | `home.scss:271-278` |
| Categoría Blog | Píldora, fondo dorado 14%, borde arcilla 25%, texto `--brand-ochre` | `blog-post.scss:43-55` |
| Chip Preview | Misma receta que categoría, texto `--brand-clay` | `preview.scss:107-118` |
| Tag Blog | Píldora, fondo dorado 12%, borde arcilla 25%, texto `--brand-clay` | `blog-post.scss:229-240` |

### 5.6 Blockquotes

Hay tres variantes:

1. **Home:** borde superior, Fraunces italic, `max-width: 30ch` (`home.scss:342-352`).
2. **Blog:** borde izquierdo `4px var(--brand-ember)`, fondo brasa 8%, radio derecho `10px` (`blog-post.scss:139-148`).
3. **Editor Quote:** borde izquierdo `4px var(--brand-dorado)`, fondo vainilla, comilla decorativa (`quote-block.ts:52-82`).

### 5.7 Tablas

**Blog** (`blog-post.scss:171-212`):

- Contenedor con borde arena, radio `12px`, fondo pergamino.
- `figcaption` con borde inferior.
- `thead` fondo vainilla, texto ocre, uppercase `0.72rem`.
- Filas pares con fondo hueso.

**Editor Table** (`table-block.ts:58-87`):

- Borde arena, radio `12px`, fondo hueso.
- Primera fila con fondo vainilla y texto espresso.
- Focus de celdas con outline dorado.

### 5.8 Footer

**Fuente:** `home.scss:412-434`.

- `display: flex`, `justify-content: space-between`.
- Borde superior `1px solid var(--line)`.
- Texto `--muted`, `0.75rem`.
- Marca en Fraunces `1.05rem`.
- En `max-width: 640px` pasa a columna.

### 5.9 Monograma y retrato

- **Header:** círculo `34px`, borde `1px currentColor`, texto `CT` (`header.scss:33-46`).
- **Home:** retrato circular `clamp(8rem, 18vw, 11rem)`, `object-fit: cover`, `object-position: center 20%`, sombra suave (`home.scss:315-326`).

### 5.10 Banda oscura

**Fuente:** `home.scss:365-408`.

- Fondo `--dark` (`#2e2118`), texto `--dark-text`.
- Eyebrow y acentos en `--dark-gold`.
- Cards con borde `rgba(247,242,232,.18)` y fondo `rgba(255,248,235,.035)`.
- Hover de card a borde `.34` y fondo `.07`.

---

## 6. Composición por página

| Página | Ruta | Fondo | Contenedor | Tipografía | Componentes |
|---|---|---|---|---|---|
| Home | `/` | `--paper` `#f9f2e4` | `78rem` | Fraunces + Inter | Header, hero, eyebrow, cards, about, banda oscura, footer |
| Blog post | `/blog/:slug` | `--brand-hueso` | `44rem` | Roboto/fallback | Header, hero centrado, portada, artículo, tabla, tags |
| Preview | `/preview` | `--brand-hueso` | `60rem` | Roboto/fallback | Header, hero, cards de editor, NgxEditor, JS2 |
| Building | `/en-construccion` | `--brand-espresso` | `35rem` | Roboto/fallback | Card glass, taza SVG, vapor, badge |
| Maintenance | sin ruta | — | — | — | Placeholder `<p>maintenance works!</p>` |

### 6.1 Anatomía de Home

1. `<app-header>` sticky.
2. **Hero:** eyebrow, H1 “The Coffee Taster”, subtítulo con énfasis italic, botones sólido/ghost, meta inferior.
3. **Propósito (`#proposito`):** eyebrow `01`, H2, lead y grid de 4 cards con índice.
4. **Quién soy (`#quien-soy`):** fondo `--paper-soft`, retrato circular, texto biográfico y blockquote.
5. **A futuro (`#futuro`):** banda oscura, H2, lead y grid de 4 cards con status “Próximamente”.
6. **Footer:** marca + copyright.

---

## 7. Matriz de trazabilidad

> Referencias de línea correspondientes al snapshot `6d7d0a9`. Si el archivo cambia, actualizar esta tabla.

| # | Elemento visual | Token / valor | Fuente | Selector | Páginas |
|---:|---|---|---|---|---|
| 1 | Fondo de página Home | `--paper: #f9f2e4` | `home.scss:5` | `:host`, `.home-page` | Home |
| 2 | Fondo Blog/Preview | `--brand-hueso: #f5ede0` | `styles.scss:41` | `:host` | Blog, Preview |
| 3 | Fondo Building | `--brand-espresso: #4a2c17` | `styles.scss:23` | `.building-page` | Building |
| 4 | Tinta principal Home | `--ink: #2b2119` | `home.scss:7` | `.home-page` | Home |
| 5 | Texto secundario Home | `--muted: #6a5644` | `home.scss:8` | `.subtitle`, `.lead`, `.card p` | Home |
| 6 | Línea/divisoria Home | `--line: #ded0b8` | `home.scss:9` | `.section`, `.hero-meta`, `.footer` | Home |
| 7 | Acento Home | `--accent: #96631f` | `home.scss:10` | `.card-index`, `.status`, focus | Home |
| 8 | Dorado Home | `--gold: #c9a227` | `home.scss:11` | `.eyebrow::before` | Home |
| 9 | Banda oscura | `--dark: #2e2118` | `home.scss:12` | `.section--dark` | Home |
| 10 | Texto sobre oscuro | `--dark-text: #f7f2e8` | `home.scss:13` | `.section--dark` | Home |
| 11 | Acento sobre oscuro | `--dark-gold: #d9b98a` | `home.scss:14` | `.section--dark .eyebrow` | Home |
| 12 | H1 Hero | Fraunces `clamp(3.6rem, 10.5vw, 8.2rem)` | `home.scss:85-93` | `.hero h1` | Home |
| 13 | H2 Sección | Fraunces `clamp(2rem, 4.2vw, 3.3rem)` | `home.scss:190-200` | `.section-head h2` | Home |
| 14 | Eyebrow | Inter `.66rem` / `.2em` | `home.scss:41-50` | `.eyebrow` | Home |
| 15 | Botón sólido | `--ink` bg / `--paper` text | `home.scss:138-147` | `.btn--solid` | Home |
| 16 | Botón ghost | transparente / `--line` | `home.scss:149-157` | `.btn--ghost` | Home |
| 17 | Card Home | borde `--line`, radio `12px` | `home.scss:228-245` | `.card` | Home |
| 18 | Hover card Home | `#cfbfa2` + dorado 6% | `home.scss:242-245` | `.card:hover` | Home |
| 19 | Card oscura | borde `rgba(247,242,232,.18)` | `home.scss:386-402` | `.section--dark .card` | Home |
| 20 | Header sticky | `rgba(249,242,228,.92)` + blur 10 | `header.scss:6-16` | `.site-header` | Home, Blog, Preview |
| 21 | Monograma header | `34px`, círculo, borde 1px | `header.scss:33-46` | `.monogram` | Home, Blog, Preview |
| 22 | Wordmark | Fraunces `1.12rem` / 500 | `header.scss:48-53` | `.wordmark` | Home, Blog, Preview |
| 23 | Navbar Material | `--mat-sys-surface-container` | `navbar.scss:6-13` | `.site-nav` | No usado actualmente (componente huérfano) |
| 24 | Categoría Blog | píldora dorada/arcilla | `blog-post.scss:43-55` | `.category` | Blog |
| 25 | H1 Blog | `clamp(1.7rem, ..., 2.6rem)` | `blog-post.scss:32-40` | `.post-hero h1` | Blog |
| 26 | H2 Blog | borde izquierdo dorado | `blog-post.scss:107-117` | `.body h2` | Blog |
| 27 | Blockquote Blog | borde brasa + fondo 8% | `blog-post.scss:139-148` | `.body blockquote` | Blog |
| 28 | Tabla Blog | arena/pergamino/vainilla | `blog-post.scss:171-212` | `.table-wrap` | Blog |
| 29 | Tag Blog | píldora arcilla/dorado | `blog-post.scss:229-240` | `.tag` | Blog |
| 30 | Card Preview | pergamino/arena/radio 16 | `preview.scss:57-65` | `.editor-card` | Preview |
| 31 | Chip Preview | píldora arcilla/dorado | `preview.scss:107-118` | `.chip` | Preview |
| 32 | Output Preview | vainilla/arena/radio 10 | `preview.scss:177-189` | `.output pre` | Preview |
| 33 | Card Building | glass espresso + blur 12 | `building.scss:26-38` | `.building-card` | Building |
| 34 | Taza SVG | hueso/café/dorado | `building.scss:68-102` | `.cup` | Building |
| 35 | Vapor | animación `steam` 2.6s | `building.scss:104-129` | `.steam` | Building |
| 36 | Badge Building | miel/dorado + punto pulse | `building.scss:40-66` | `.badge` | Building |
| 37 | Footer Home | borde `--line`, texto `--muted` | `home.scss:412-434` | `.footer` | Home |
| 38 | Focus visible Home | `2px solid --accent`, offset 3 | `home.scss:62-65` | `a:focus-visible` | Home |
| 39 | Focus editor | `2px solid --brand-dorado` | `text-block.ts:47-51` y otros | `:host:focus-within` | Preview |
| 40 | Portada Blog | degradado espresso→roast | `blog-post.scss:81-91` | `.cover` | Blog |

### 7.1 Tokens declarados sin uso

| Token | Valor | Acción sugerida |
|---|---|---|
| `--brand-cortado` | `#8c6242` | Eliminar o usar en variantes de cita |
| `--brand-latte` | `#c8a06a` | Eliminar o usar como `--dark-gold` |
| `--brand-gold` | `#ffd98a` | Eliminar o usar en hover dorado |
| `--brand-gold-hover` | `#ffe3a8` | Eliminar |
| `--brand-leche` | `#efe0c2` | Eliminar |
| `--brand-sand` | `#e5d5b3` | Eliminar |
| `--brand-linen` | `#e7e0d3` | Eliminar |
| `--brand-coal` | `#201510` | Eliminar o usar como `--dark` de Home |

### 7.2 Dependencias externas del estilo

| Dependencia | Uso | Fuente |
|---|---|---|
| `@angular/material` 21.2.x | Toolbar, Card, Button, theming | `package.json:32` |
| `Fraunces` (Google Fonts) | Display editorial | `index.html:13` |
| `Inter` (Google Fonts) | Cuerpo Home | `index.html:13` |
| `Material Icons` | Iconografía | `index.html:15` |
| `@tmdjr/ngx-editor-js2` | Editor por bloques y drag preview | `package.json:35`, `styles.scss:3` |
| `ngx-editor` | Editor WYSIWYG de Preview | `package.json:38` |
| `grapesjs` | CSS global cargado en build | `angular.json:34` |

---

## 8. Guía de replicación desde cero

Esta sección permite reconstruir el estilo actual en un proyecto Angular nuevo.

### 8.1 Requisitos

- Node.js compatible con Angular 21.
- `pnpm` 12.6.0 (declarado en `package.json:24`).
- Angular CLI 21.
- Acceso a Google Fonts.

### 8.2 Pasos

#### Paso 1 — Crear el proyecto

```bash
pnpm dlx @angular/cli@21 new thecoffeetaster-frontend \
  --style=scss \
  --routing \
  --ssr=false
cd thecoffeetaster-frontend
pnpm install
```

#### Paso 2 — Añadir Angular Material

```bash
pnpm exec ng add @angular/material
```

Elegir un tema base cualquiera; se reemplazará por el tema generado.

#### Paso 3 — Cargar las fuentes

En `src/index.html`, dentro de `<head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link
  href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..700;1,9..144,300..600&family=Inter:wght@300;400;500;600&display=swap"
  rel="stylesheet">
<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
```

> Si se mantiene `typography: Roboto`, añadir también Roboto o cambiar la tipografía Material a Inter para evitar el fallback.

#### Paso 4 — Generar la paleta

```bash
pnpm exec ng generate @angular/material:theme-color
```

Introducir los seeds:

| Rol | Seed |
|---|---|
| Primary | `#4A2C17` |
| Secondary | `#C9A227` |
| Tertiary | `#C8A06A` |
| Neutral | `#EFE0C2` |
| Neutral variant | `#FBF0D9` |

El schematic genera `src/_theme-colors.scss` con `$primary-palette` y `$tertiary-palette`.

#### Paso 5 — Configurar `src/styles.scss`

```scss
@use '@angular/material' as mat;
@use './theme-colors' as theme;
@use '@tmdjr/ngx-editor-js2/styles/drag-preview';

html {
  height: 100%;
  @include mat.theme((
    color: (
      theme-type: light,
      primary: theme.$primary-palette,
      tertiary: theme.$tertiary-palette,
    ),
    typography: Roboto,
    density: 0,
  ));
}

:root {
  --brand-espresso: #4a2c17;
  --brand-roast: #5a3a22;
  --brand-toast: #3a2718;
  --brand-coffee: #6f4e37;
  --brand-cortado: #8c6242;
  --brand-latte: #c8a06a;
  --brand-honey: #e8c97a;
  --brand-dorado: #c9a227;
  --brand-gold: #ffd98a;
  --brand-gold-hover: #ffe3a8;
  --brand-arena: #e2c799;
  --brand-leche: #efe0c2;
  --brand-tint: #f6ead3;
  --brand-sand: #e5d5b3;
  --brand-linen: #e7e0d3;
  --brand-parchment: #fffdf9;
  --brand-vainilla: #fbf0d9;
  --brand-crema: #fff8eb;
  --brand-hueso: #f5ede0;
  --brand-ink: #1c1917;
  --brand-body: #292524;
  --brand-coal: #201510;
  --brand-muted: #57534e;
  --brand-soft: #44403c;
  --brand-ochre: #92600f;
  --brand-clay: #b45309;
  --brand-ember: #c2410c;
}

body {
  color-scheme: light;
  background-color: var(--mat-sys-surface);
  color: var(--mat-sys-on-surface);
  font: var(--mat-sys-body-medium);
  margin: 0;
  height: 100%;
}
```

#### Paso 6 — Crear los tokens de Home

En `src/app/page/home/home.scss`, al inicio:

```scss
@use '@angular/material' as mat;

:host {
  --paper: #f9f2e4;
  --paper-soft: #f1e7d5;
  --ink: #2b2119;
  --muted: #6a5644;
  --line: #ded0b8;
  --accent: #96631f;
  --gold: #c9a227;
  --dark: #2e2118;
  --dark-text: #f7f2e8;
  --dark-gold: #d9b98a;
  --font-display: 'Fraunces', 'Iowan Old Style', Georgia, serif;
  --font-body: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;

  display: block;
  min-height: 100dvh;
  background: var(--paper);
}
```

#### Paso 7 — Estructura semántica de Home

```html
<app-header></app-header>
<main class="home-page">
  <section class="hero" aria-labelledby="hero-title">
    <p class="eyebrow">Desde cero, taza a taza</p>
    <div class="hero-grid">
      <h1 id="hero-title">The Coffee<br />Taster</h1>
      <div class="hero-aside">
        <p class="subtitle">...</p>
        <nav class="hero-actions" aria-label="Secciones principales">
          <a class="btn btn--solid" href="#proposito">Ver el propósito <span aria-hidden="true">→</span></a>
          <a class="btn btn--ghost" href="#quien-soy">Quién soy</a>
        </nav>
      </div>
    </div>
    <div class="hero-meta" aria-hidden="true">
      <span>Registro personal de café</span>
      <span>{{ currentYear }}</span>
    </div>
  </section>

  <section id="proposito" class="section" aria-labelledby="proposito-title">
    <div class="section-inner">
      <div class="section-head">
        <p class="eyebrow">01 — Propósito inicial</p>
        <h2 id="proposito-title">Registrar el café sin complicarlo</h2>
      </div>
      <div class="section-body">
        <p class="lead">...</p>
        <div class="grid"><!-- mat-card --></div>
      </div>
    </div>
  </section>
</main>
```

#### Paso 8 — Layout editorial

```scss
.home-page {
  box-sizing: border-box;
  width: 100%;
  margin: 0;
  padding: 0;
  overflow-x: clip;
  background: var(--paper);
  color: var(--ink);
  font-family: var(--font-body);
  font-size: 1rem;
  line-height: 1.7;
  -webkit-font-smoothing: antialiased;
}

.hero {
  max-width: 78rem;
  margin: 0 auto;
  padding: clamp(3.5rem, 9vw, 7rem) clamp(1.25rem, 4vw, 3rem) 0;
}

.hero-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(18rem, 0.85fr);
  align-items: end;
  gap: clamp(1.5rem, 4vw, 4rem);
  margin-top: 0.85rem;
}

.section {
  border-top: 1px solid var(--line);
}

.section-inner {
  display: grid;
  grid-template-columns: minmax(0, 0.72fr) minmax(0, 1.28fr);
  gap: clamp(1.5rem, 5vw, 5rem);
  max-width: 78rem;
  margin: 0 auto;
  padding: clamp(3.5rem, 8vw, 6.5rem) clamp(1.25rem, 4vw, 3rem);
}

@media (max-width: 960px) {
  .hero-grid,
  .section-inner {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
```

#### Paso 9 — Replicar componentes

| Necesitas | Copia de | Líneas de referencia |
|---|---|---|
| Header sticky | `src/app/components/header/header.scss` | 1-53 |
| Botones Home | `src/app/page/home/home.scss` | 120-157 |
| Cards Home | `src/app/page/home/home.scss` | 228-278 |
| Sección About | `src/app/page/home/home.scss` | 282-361 |
| Banda oscura | `src/app/page/home/home.scss` | 365-408 |
| Footer Home | `src/app/page/home/home.scss` | 412-434 |
| Artículo Blog | `src/app/page/blog-post/blog-post.scss` | 1-267 |
| Cards Preview | `src/app/page/preview/preview.scss` | 57-129 |
| Building | `src/app/page/building/building.scss` | 1-230 |
| Bloques editor | `src/app/shared/editor-blocks/*.ts` | Estilos inline |

#### Paso 10 — Verificar

Ejecutar:

```bash
pnpm start
pnpm build
```

Y aplicar la checklist de la sección 9.

### 8.3 Orden recomendado de replicación

1. Fuentes y `index.html`.
2. `_theme-colors.scss` generado.
3. `styles.scss` con `mat.theme` y `--brand-*`.
4. Tokens locales de Home.
5. Layout base (hero, sección, grid).
6. Header.
7. Patrones (eyebrow, botones, cards).
8. Secciones específicas (about, banda oscura, footer).
9. Páginas secundarias.
10. Responsive y accesibilidad.

---

## 9. Checklist de verificación

| # | Verificación | Resultado esperado | Cómo comprobar |
|---:|---|---|---|
| 1 | Fuentes cargadas | Fraunces, Inter y Material Icons disponibles | DevTools → Network → Fonts |
| 2 | Tokens globales | `--brand-*` presentes en `:root` | DevTools → Computed → `:root` |
| 3 | Tokens Home | `--paper`, `--ink`, etc. presentes en `app-home` | Inspeccionar `:host` |
| 4 | Fondo Home | `#f9f2e4` | Inspeccionar `.home-page` |
| 5 | Fondo Blog/Preview | `#f5ede0` | Inspeccionar `:host` |
| 6 | Fondo Building | `#4a2c17` | Inspeccionar `.building-page` |
| 7 | Hero responsive | 2 columnas >960 px; 1 columna ≤960 px | Redimensionar ventana |
| 8 | Cards responsive | 2 columnas >640 px; 1 columna ≤640 px | Redimensionar ventana |
| 9 | Header sticky | Permanece arriba al hacer scroll | Scroll en Home |
| 10 | Banda oscura | Fondo `#2e2118`, texto claro, cards traslúcidas | Scroll a “A futuro” |
| 11 | Focus visible | Outline de 2 px en enlaces de Home | Tabulador |
| 12 | Contraste | Texto normal ≥ 4.5:1 | Ver sección 10 |
| 13 | Reduced motion | Sin animaciones si el SO lo pide | Activar preferencia |
| 14 | Sin scroll horizontal | `overflow-x: clip` y grids fluidos | 360 px, 768 px, 1440 px |
| 15 | Build | `pnpm build` sin errores | Terminal |
| 16 | Consistencia tipográfica | Home usa Fraunces/Inter; revisar Blog/Preview | Inspeccionar H1/H2 |

---

## 10. Accesibilidad

### 10.1 Contraste calculado

Ratios WCAG calculados con luminancia relativa:

| Combinación | Ratio | Uso | Evaluación |
|---|---:|---|---|
| `--ink` `#2b2119` sobre `--paper` `#f9f2e4` | **14.13:1** | Texto principal Home | AAA |
| `--muted` `#6a5644` sobre `--paper` | **6.23:1** | Texto secundario Home | AA/AAA |
| `--accent` `#96631f` sobre `--paper` | **4.60:1** | Índices/status | AA justo |
| `--gold` `#c9a227` sobre `--paper` | **2.17:1** | Línea decorativa | Solo decorativo |
| `--line` `#ded0b8` sobre `--paper` | **1.36:1** | Bordes | No texto |
| `--dark-text` `#f7f2e8` sobre `--dark` `#2e2118` | **13.97:1** | Texto banda oscura | AAA |
| `--dark-gold` `#d9b98a` sobre `--dark` | **8.36:1** | Eyebrow oscuro | AAA |
| `--brand-ink` `#1c1917` sobre `--brand-hueso` | **15.05:1** | Títulos Blog | AAA |
| `--brand-body` `#292524` sobre `--brand-hueso` | **13.05:1** | Cuerpo Blog | AAA |
| `--brand-muted` `#57534e` sobre `--brand-hueso` | **6.57:1** | Secundario Blog | AA/AAA |
| `--brand-ochre` `#92600f` sobre `--brand-vainilla` | **4.76:1** | Labels/tabla | AA |
| `--brand-clay` `#b45309` sobre `--brand-vainilla` | **4.44:1** | Tags/chips | **AA limítrofe** |
| `--brand-hueso` `#f5ede0` sobre `--brand-espresso` | **10.86:1** | Texto Building | AAA |
| `--brand-honey` `#e8c97a` sobre `--brand-espresso` | **7.85:1** | Badge Building | AAA |

**Observaciones:**

- El dorado (`--gold`/`--brand-dorado`) se usa como línea, borde o marcador, no como texto de párrafo. Correcto.
- `--brand-clay` sobre vainilla queda en `4.44:1`, apenas por debajo de AA para texto normal. Los tags son `0.72rem`/700/uppercase; conviene oscurecer el texto o aumentar el tamaño.
- Los textos de `0.64rem`–`0.66rem` (status, eyebrow) son muy pequeños. Aunque el contraste sea alto, considerar un mínimo de `0.75rem` para legibilidad.

### 10.2 Semántica y focus

- Home usa `<main>`, `<section aria-labelledby>`, `<nav aria-label>`, `<footer>`.
- El header usa `aria-label` en el enlace de marca.
- Los elementos decorativos usan `aria-hidden="true"`.
- Home define `a:focus-visible` con outline visible (`home.scss:62-65`).
- Material aporta focus visible en sus propios botones (Navbar, Preview).
- El editor usa `:host:focus-within` con outline dorado.

### 10.3 Movimiento

- Blog, Preview y Building respetan `prefers-reduced-motion`.
- **Pendiente:** añadir el mismo bloque a Home.

---

## 11. Deuda visual y plan de normalización

| # | Hallazgo | Evidencia | Impacto | Recomendación | Prioridad |
|---:|---|---|---|---|---|
| 1 | Tres sistemas de tokens | `--mat-sys-*`, `--brand-*`, tokens locales Home | Inconsistencia y difícil mantenimiento | Definir una capa semántica `--ui-*` que envuelva `--brand-*` y usar Home como tema editorial | Alta |
| 2 | Roboto declarada pero no cargada | `styles.scss:13` vs `index.html` | Blog/Preview/Building usan fallback del sistema | Cargar Roboto o cambiar `typography` a Inter | Alta |
| 3 | Header con colores hardcodeados | `header.scss:12-15, 42` | No responde a cambios de token | Usar `var(--paper)`, `var(--line)`, `var(--ink)` | Alta |
| 4 | Navbar Material divergente y huérfano | `navbar.scss:6-13`; importado en `home.ts:4` pero no declarado en `imports` | Rompe la estética editorial y es código muerto | Rediseñar con tokens Home o eliminar hasta que se use | Media |
| 5 | Blog/Preview sin tipografía display | `blog-post.scss`, `preview.scss` | Títulos con fallback, no Fraunces | Aplicar `--font-display` a H1/H2 de páginas editoriales | Alta |
| 6 | Patrones duplicados | Categoría/chip/tag/back repetidos en Blog y Preview | Cambios requieren tocar varios archivos | Extraer componentes compartidos (`app-tag`, `app-back-link`) | Media |
| 7 | 8 tokens sin uso | `--brand-cortado`, `latte`, `gold`, `gold-hover`, `leche`, `sand`, `linen`, `coal` | Ruido y falsa sensación de paleta amplia | Eliminar o documentar como reservados | Baja |
| 8 | Home sin reduced motion | `home.scss` | Accesibilidad | Añadir bloque `@media (prefers-reduced-motion: reduce)` | Media |
| 9 | `!important` en cards | `home.scss:235, 237` | Dificulta overrides | Evaluar `mat.card-overrides` más completo o encapsular | Baja |
| 10 | `maintenance` huérfano | `maintenance.html:1`, sin ruta | Código muerto | Eliminar o conectar a ruta | Baja |
| 11 | Tags con contraste 4.44:1 | `blog-post.scss:229-240` | AA limítrofe | Oscurecer `--brand-clay` o aumentar tamaño/peso | Media |
| 12 | Textos muy pequeños | `.eyebrow` `.66rem`, `.status` `.64rem` | Legibilidad | Subir a `.72rem`–`.75rem` | Media |
| 13 | Sin modo oscuro | `theme-type: light` | Solo claro | Documentar como decisión o preparar `light dark` | Baja |
| 14 | Breakpoints literales | `960px`, `640px` repetidos | Difícil consistencia | Documentar y centralizar en mixins | Baja |
| 15 | `app.scss` vacío | 0 líneas | Sin impacto | Eliminar o usar para estilos globales de shell | Baja |

### 11.1 Ruta sugerida

1. **Fase 1 — Consolidación de tokens:** crear `--ui-*` semánticos y mapear Home a ellos. Mantener `--brand-*` como primitivos.
2. **Fase 2 — Tipografía:** cargar Roboto o unificar todo a Inter/Fraunces. Aplicar display a Blog/Preview.
3. **Fase 3 — Componentes compartidos:** tag, chip, back-link, card editorial y botón.
4. **Fase 4 — Accesibilidad:** reduced motion en Home, contraste de tags, tamaños mínimos.
5. **Fase 5 — Limpieza:** tokens sin uso, `maintenance`, `app.scss`, navbar.

---

## 12. Gobernanza y mantenimiento

### 12.1 Convención de nombres

| Prefijo | Uso | Ejemplo |
|---|---|---|
| `--brand-*` | Primitivos de marca globales | `--brand-dorado` |
| `--ui-*` (propuesto) | Tokens semánticos de interfaz | `--ui-surface`, `--ui-text-muted` |
| `--mat-sys-*` | Sistema Material, no editar a mano | `--mat-sys-surface` |
| `--font-*` | Familias tipográficas | `--font-display` |

### 12.2 Reglas

1. **No usar hex directamente en componentes nuevos.** Usar un token.
2. **No duplicar paletas por página.** Si una página necesita una variante, derivarla de `--brand-*`.
3. **Toda página nueva debe reutilizar:** header, eyebrow, botones, cards y footer.
4. **Los cambios de color de marca se hacen en los seeds** y se regenera `_theme-colors.scss`; luego se actualizan los `--brand-*` si cambian los valores.
5. **Los tokens sin uso se eliminan** o se documentan como reservados.
6. **Toda animación debe respetar `prefers-reduced-motion`.**
7. **Todo texto debe cumplir AA (4.5:1) como mínimo.**

### 12.3 Flujo para cambiar el tema

1. Actualizar seeds en el schematic o en `_theme-colors.scss`.
2. Regenerar la paleta.
3. Actualizar `--brand-*` en `styles.scss`.
4. Revisar tokens locales de Home.
5. Ejecutar checklist de la sección 9.
6. Actualizar la tabla de trazabilidad y el snapshot de este documento.

### 12.4 Checklist para PRs de estilo

- [ ] ¿Usa tokens existentes?
- [ ] ¿Evita hex hardcodeados?
- [ ] ¿Respeta los breakpoints 960/640?
- [ ] ¿Tiene focus visible?
- [ ] ¿Cumple contraste AA?
- [ ] ¿Respeta `prefers-reduced-motion`?
- [ ] ¿Reutiliza patrones existentes?
- [ ] ¿Actualizó este documento si cambió un token o patrón?

---

## 13. Registro de cambios del documento

| Fecha | Commit | Cambio |
|---|---|---|
| 29/10/2026 | `6d7d0a9` | Creación del documento con snapshot del tema actual |

> **Cómo actualizar:** al cambiar estilos, añadir una fila con fecha, commit y resumen. Si cambian valores, actualizar las tablas de la sección 4 y la matriz de la sección 7.

---

## Apéndice A — Cheat sheet

### Colores más usados

| Uso | Token | Hex |
|---|---|---|
| Fondo Home | `--paper` | `#f9f2e4` |
| Fondo Blog/Preview | `--brand-hueso` | `#f5ede0` |
| Fondo Building | `--brand-espresso` | `#4a2c17` |
| Texto Home | `--ink` | `#2b2119` |
| Texto secundario Home | `--muted` | `#6a5644` |
| Dorado | `--gold` / `--brand-dorado` | `#c9a227` |
| Borde Home | `--line` | `#ded0b8` |
| Banda oscura | `--dark` | `#2e2118` |
| Texto oscuro | `--dark-text` | `#f7f2e8` |
| Acento oscuro | `--dark-gold` | `#d9b98a` |

### Medidas clave

| Medida | Valor |
|---|---|
| Contenedor Home | `78rem` |
| Contenedor Blog | `44rem` |
| Contenedor Preview | `60rem` |
| Radio card Home | `12px` |
| Radio card Preview | `16px` |
| Radio píldora | `999px` |
| Breakpoints | `960px`, `640px` |
| Header | `4.25rem` |

### Comandos

```bash
pnpm install
pnpm start
pnpm build
pnpm exec ng generate @angular/material:theme-color
```

---

## Apéndice B — Mapa de archivos

```text
src/
├── index.html                     # fuentes y metadatos
├── styles.scss                    # mat.theme + --brand-*
├── _theme-colors.scss             # paletas generadas
└── app/
    ├── app.ts / app.html / app.scss
    ├── app.config.ts              # providers + bloques editor
    ├── app.routes.ts              # rutas
    ├── components/
    │   ├── header/                # cabecera sticky
    │   └── navbar/                # navegación Material
    ├── page/
    │   ├── home/                  # referencia canónica
    │   ├── blog-post/             # artículo
    │   ├── preview/               # demo editores
    │   ├── building/              # en construcción
    │   └── maintenance/           # placeholder sin ruta
    └── shared/
        └── editor-blocks/         # bloques con estilos inline
```
