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

      const message =
        getApiErrorMessage(error);

      if (error.status === 401) {

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
