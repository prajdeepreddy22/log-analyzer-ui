import {
  CanActivateFn,
  Router
} from '@angular/router';
import { inject } from '@angular/core';
import { AuthStoreService } from '../stores/auth-store.service';

export const authGuard: CanActivateFn = (route, state) => {

  const router = inject(Router);

  const authStore =
    inject(AuthStoreService);

  // ===============================
  // NOT LOGGED IN → REDIRECT
  // ===============================
  if (!authStore.isAuthenticated()) {

    authStore.clear();

    return router.createUrlTree(
      ['/login'],
      {
        queryParams: {
          returnUrl: state.url
        }
      }
    );
  }

  // ===============================
  // LOGGED IN → ALLOW ACCESS
  // ===============================
  return true;
};
