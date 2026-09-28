import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideAppInitializer, inject } from '@angular/core';
import { provideRouter } from '@angular/router';
import { MatIconRegistry } from '@angular/material/icon';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
  ]
};
