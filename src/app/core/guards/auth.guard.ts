import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthStoreService } from '../stores/auth-store.service';

export const authGuard: CanActivateFn = (route, state) => {

  const router = inject(Router);

  const authStore =
    inject(AuthStoreService);

  // ===============================
  // NOT LOGGED IN → REDIRECT
  // ===============================
  if (!authStore.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }

  // ===============================
  // LOGGED IN → ALLOW ACCESS
  // ===============================
  return true;
};
