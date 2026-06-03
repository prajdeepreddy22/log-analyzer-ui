import { ApplicationConfig } from '@angular/core';

import { provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideToastr } from 'ngx-toastr';

import { routes } from './app.routes';

import { authInterceptor } from './core/interceptors/auth.interceptor';
import { apiErrorInterceptor } from './core/interceptors/api-error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [

    // ===============================
    // PERFORMANCE OPTIMIZATION
    // ===============================
    provideZoneChangeDetection({
      eventCoalescing: true
    }),

    // ===============================
    // ROUTING
    // ===============================
    provideRouter(routes),

    // ===============================
    // HTTP CLIENT + INTERCEPTOR
    // ===============================
    provideHttpClient(
      withInterceptors([
        authInterceptor,
        apiErrorInterceptor
      ])
    ),

    // ===============================
    // ANIMATIONS
    // ===============================
    provideAnimations(),

    provideToastr({
      positionClass: 'toast-bottom-right',
      preventDuplicates: true,
      closeButton: true,
      progressBar: true,
      timeOut: 3500
    })

  ]
};
