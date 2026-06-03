import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

import { LoginRequest } from '../models/auth/login-request.model';
import { RegisterRequest } from '../models/auth/register-request.model';
import { AuthResponse } from '../models/auth/auth-response.model';
import { AuthUserModel } from '../models/auth/auth-user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthApiService {

  private readonly http = inject(HttpClient);

  private readonly baseUrl = `${environment.apiBaseUrl}/auth`;

  login(payload: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${this.baseUrl}/login`,
      payload
    );
  }

  register(payload: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${this.baseUrl}/register`,
      payload
    );
  }

  getMe(): Observable<AuthUserModel> {
    return this.http.get<AuthUserModel>(
      `${this.baseUrl}/me`
    );
  }

  updateProfile(
    payload: Pick<AuthUserModel, 'displayName'>
  ): Observable<AuthUserModel> {
    return this.http.patch<AuthUserModel>(
      `${this.baseUrl}/profile`,
      payload
    );
  }
}
