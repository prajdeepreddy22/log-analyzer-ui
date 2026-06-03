import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';

import {
  catchError,
  tap
} from 'rxjs/operators';
import {
  EMPTY,
  Observable
} from 'rxjs';

import { AuthApiService } from '../api/auth-api.service';

import { LoginRequest } from '../models/auth/login-request.model';
import { RegisterRequest } from '../models/auth/register-request.model';
import { AuthResponse } from '../models/auth/auth-response.model';
import { AuthUserModel } from '../models/auth/auth-user.model';

import { AuthStoreService } from '../stores/auth-store.service';
import { RateLimitStoreService } from '../stores/rate-limit-store.service';
import { ChatStoreService } from '../stores/chat-store.service';
import { AnalysisStoreService } from '../stores/analysis-store.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly authApi = inject(AuthApiService);
  private readonly router = inject(Router);
  private readonly authStore = inject(AuthStoreService);
  private readonly rateLimitStore = inject(RateLimitStoreService);
  private readonly chatStore = inject(ChatStoreService);
  private readonly analysisStore = inject(AnalysisStoreService);

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

  readonly user =
    this.authStore.user;

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

    this.loadCurrentUser()
      .pipe(
        catchError(() =>
          EMPTY
        )
      )
      .subscribe();
  }

  loadCurrentUser(): Observable<AuthUserModel> {

    return this.authApi
      .getMe()
      .pipe(
        tap(user =>
          this.authStore.setUser(user)
        )
      );
  }

  updateProfile(
    displayName: string
  ): Observable<AuthUserModel> {

    return this.authApi
      .updateProfile({
        displayName
      })
      .pipe(
        tap(user => {

          this.authStore.setUser({
            ...(this.authStore.user() ?? {}),
            ...(user ?? {}),
            displayName:
              user?.displayName ??
              displayName
          });
        })
      );
  }

  // =====================================================
  // LOGOUT
  // =====================================================
  logout(): void {

    this.authStore.clear();
    this.rateLimitStore.stopCountdowns();
    this.rateLimitStore.stopPolling();
    this.chatStore.clearChat();
    this.chatStore.setLoading(false);
    this.chatStore.setStreaming(false);
    this.analysisStore.stopPolling();

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
