import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';

import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';

import { AuthApiService } from '../api/auth-api.service';

import { LoginRequest } from '../models/auth/login-request.model';
import { RegisterRequest } from '../models/auth/register-request.model';
import { AuthResponse } from '../models/auth/auth-response.model';

import { AuthStoreService } from '../stores/auth-store.service';
import { RateLimitStoreService } from '../stores/rate-limit-store.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly authApi = inject(AuthApiService);
  private readonly router = inject(Router);
  private readonly authStore = inject(AuthStoreService);
  private readonly rateLimitStore = inject(RateLimitStoreService);

  // =====================================================
  // AUTH STATE (SIGNAL BASED)
  // =====================================================
  readonly isAuthenticated =
    this.authStore.isAuthenticated;

  readonly token =
    this.authStore.token;

  readonly displayName =
    this.authStore.displayName;

  readonly initials =
    this.authStore.initials;

  // =====================================================
  // LOGIN
  // =====================================================
  login(payload: LoginRequest): Observable<AuthResponse> {

    return this.authApi.login(payload).pipe(

      tap((response) => {
        this.handleAuthSuccess(response);
      })

    );
  }

  // =====================================================
  // REGISTER
  // =====================================================
  register(payload: RegisterRequest): Observable<AuthResponse> {

    return this.authApi.register(payload).pipe(

      tap((response) => {
        this.handleAuthSuccess(response);
      })

    );
  }

  // =====================================================
  // AUTH SUCCESS HANDLER (CENTRALIZED)
  // =====================================================
  private handleAuthSuccess(response: AuthResponse): void {

    if (!response?.token) return;

    this.authStore.setToken(response.token);

    this.rateLimitStore.refreshNow();
  }

  // =====================================================
  // LOGOUT
  // =====================================================
  logout(): void {

    this.authStore.clear();
    this.rateLimitStore.stopCountdowns();

    // optional cleanup hook for future stores
    // resetAuthStore();

    this.router.navigate(['/login']);
  }

  // =====================================================
  // TOKEN ACCESS
  // =====================================================
  getToken(): string | null {
    return this.authStore.getToken();
  }

  // =====================================================
  // HELPER: CHECK LOGIN
  // =====================================================
  isLoggedIn(): boolean {
    return this.authStore.isAuthenticated();
  }
}
