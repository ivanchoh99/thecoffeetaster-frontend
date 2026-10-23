import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { NGX_EDITORJS_OPTIONS } from '@tmdjr/ngx-editor-js2';

import { routes } from './app.routes';
import {
  ListBlockComponent,
  QuoteBlockComponent,
  TableBlockComponent,
  TextBlockComponent,
} from './shared/editor-blocks';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideAnimationsAsync(),
    {
      provide: NGX_EDITORJS_OPTIONS,
      useValue: {
        consumerSupportedBlocks: [
          {
            name: 'Cita',
            componentInstanceName: 'QuoteBlockComponent',
            component: QuoteBlockComponent,
          },
          {
            name: 'Lista',
            componentInstanceName: 'ListBlockComponent',
            component: ListBlockComponent,
          },
          {
            name: 'Tabla',
            componentInstanceName: 'TableBlockComponent',
            component: TableBlockComponent,
          },
          {
            name: 'Texto',
            componentInstanceName: 'TextBlockComponent',
            component: TextBlockComponent,
          },
        ],
      },
    },
  ]
};