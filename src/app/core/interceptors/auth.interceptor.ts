import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthStoreService } from '../stores/auth-store.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {

  const authStore =
    inject(AuthStoreService);

  const token =
    authStore.getToken();

  const isAuthRequest =
    req.url.includes('/auth/login') ||
    req.url.includes('/auth/register');

  // ===============================
  // ATTACH TOKEN
  // ===============================
  const authReq = token && !isAuthRequest
    ? req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      })
    : req;

  return next(authReq);
};
