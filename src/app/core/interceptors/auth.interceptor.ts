import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthStoreService } from '../stores/auth-store.service';
import { environment } from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {

  const authStore =
    inject(AuthStoreService);

  const token =
    authStore.getToken();

  const isAuthRequest =
    isPublicAuthRequest(req.url);

  const normalizedToken =
    token
      ?.trim()
      .replace(/^Bearer\s+/i, '') ||
    null;

  // ===============================
  // ATTACH TOKEN
  // ===============================
  const authReq = normalizedToken && !isAuthRequest
    ? req.clone({
        setHeaders: {
          Authorization:
            `Bearer ${normalizedToken}`
        }
      })
    : req;

  if (!environment.production) {
    console.debug(
      '[Auth interceptor]',
      {
        url: req.url,
        publicAuthRequest: isAuthRequest,
        tokenPresent: !!normalizedToken,
        authorization:
          authReq.headers.has('Authorization')
            ? 'Bearer [redacted]'
            : 'not attached'
      }
    );
  }

  return next(authReq);
};

function isPublicAuthRequest(
  url: string
): boolean {

  const path =
    url
      .split('?')[0]
      .replace(/\/+$/, '');

  return (
    path.endsWith('/auth/login') ||
    path.endsWith('/auth/register')
  );
}
