import {
  HttpErrorResponse,
  HttpInterceptorFn
} from '@angular/common/http';

import { inject } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

import { AuthStoreService } from '../stores/auth-store.service';
import { getApiErrorMessage } from '../utils/api-error-message.util';
import { SessionEventsService } from '../services/session-events.service';
import { environment } from '../../../environments/environment';

export const apiErrorInterceptor: HttpInterceptorFn = (
  req,
  next
) => {

  const authStore =
    inject(AuthStoreService);

  const sessionEvents =
    inject(SessionEventsService);

  const toastr =
    inject(ToastrService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {

      if (!isApiRequest(req.url)) {
        return throwError(() => error);
      }

      const message =
        getApiErrorMessage(error);

      const hadSession =
        authStore.isAuthenticated();

      if (
        error.status === 401 &&
        hadSession
      ) {

        authStore.clear();

        sessionEvents.notifyExpired();
      }

      if (!req.url.includes('/analysis/')) {

        toastr.error(
          message,
          'Request failed',
          {
            timeOut: 3500,
            closeButton: true,
            progressBar: true
          }
        );
      }

      return throwError(() => error);
    })
  );
};

function isApiRequest(
  url: string
): boolean {

  const baseUrl =
    environment.apiBaseUrl
      .replace(/\/+$/, '');

  return (
    url === baseUrl ||
    url.startsWith(`${baseUrl}/`)
  );
}
