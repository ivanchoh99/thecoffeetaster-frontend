# ThecoffetasterFrontend

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.0.1.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Autenticación (login)

La feature de login usa una API de autenticación que aún no tiene backend.
Para desarrollar en local hay un **mock de API** incluido en el repositorio:

```bash
pnpm mock:api     # terminal 1 → http://127.0.0.1:3000
pnpm start        # terminal 2 → http://localhost:4200
```

El proxy de desarrollo (`proxy.conf.json`) reenvía las peticiones `/api/*` del
servidor de Angular al mock, de modo que la app usa las mismas rutas relativas
que en producción.

Usuarios seed del mock:

| Email | Contraseña |
| :--- | :--- |
| `autor@thecoffeetaster.com` | `Cafe#Segur0!2026` |
| `editor@thecoffeetaster.com` | `Prensa#Cafe2026!` |

Detalle del contrato y de las reglas replicadas en
[`mock-server/README.md`](mock-server/README.md).

La especificación completa de la feature está en
[`.context/features/login/`](.context/features/login/).

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Documentación de estilo

La guía de estilo, trazabilidad y replicabilidad visual del proyecto está en:

- [`docs/GUIA-ESTILO.md`](docs/GUIA-ESTILO.md)

Incluye paleta, tipografía, layout, patrones de componentes, matriz de trazabilidad, checklist de verificación y pasos para reconstruir el tema desde cero.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
