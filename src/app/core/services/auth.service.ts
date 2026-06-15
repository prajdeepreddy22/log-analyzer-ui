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
import { UploadStoreService } from '../stores/upload-store.service';
import { LogStoreService } from '../stores/log-store.service';
import { ChatStreamingService } from './chat-streaming.service';
import { environment } from '../../../environments/environment';

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
  private readonly uploadStore = inject(UploadStoreService);
  private readonly logStore = inject(LogStoreService);
  private readonly chatStreaming = inject(ChatStreamingService);

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

    const token =
      response?.token;

    if (!token?.trim()) {
      throw new Error(
        'Authentication succeeded but no access token was returned.'
      );
    }

    this.clearTenantState();
    this.authStore.setToken(token);

    if (!environment.production) {
      console.debug(
        '[Auth] JWT stored successfully.',
        {
          storageKey: 'logai_token',
          tokenPresent: true
        }
      );
    }

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
    this.clearTenantState();

    this.router.navigate(['/login']);
  }

  private clearTenantState(): void {

    this.rateLimitStore.stopCountdowns();
    this.rateLimitStore.stopPolling();
    this.rateLimitStore.reset();
    this.chatStore.clearChat();
    this.chatStore.setLoading(false);
    this.chatStore.setStreaming(false);
    this.analysisStore.reset();
    this.uploadStore.reset();
    this.logStore.reset();
    this.chatStreaming.closeAll();
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
