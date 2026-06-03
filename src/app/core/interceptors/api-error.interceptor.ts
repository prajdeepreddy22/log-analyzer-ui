import {
  HttpErrorResponse,
  HttpInterceptorFn
} from '@angular/common/http';

import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

import { AuthStoreService } from '../stores/auth-store.service';
import { getApiErrorMessage } from '../utils/api-error-message.util';

export const apiErrorInterceptor: HttpInterceptorFn = (
  req,
  next
) => {

  const router =
    inject(Router);

  const authStore =
    inject(AuthStoreService);

  const toastr =
    inject(ToastrService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {

      const message =
        getApiErrorMessage(error);

      if (error.status === 401) {

        authStore.clear();

        router.navigate(['/login']);
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
