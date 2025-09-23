import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';


import { importProvidersFrom } from '@angular/core';
import { LucideAngularModule, BarChart2, Home, Users, Settings, LogOut } from 'lucide-angular';
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(
     
    ),
     importProvidersFrom(
      LucideAngularModule.pick({ BarChart2, Home, Users, Settings, LogOut })
    )
  ]
};
