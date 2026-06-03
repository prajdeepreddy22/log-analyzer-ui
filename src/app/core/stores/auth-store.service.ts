import {
  Injectable,
  computed,
  signal
} from '@angular/core';

import { TokenStorageUtil } from '../utils/token-storage.util';

@Injectable({
  providedIn: 'root'
})
export class AuthStoreService {

  private readonly tokenSignal =
    signal<string | null>(
      TokenStorageUtil.getToken()
    );

  readonly token = computed(() =>
    this.tokenSignal()
  );

  readonly isAuthenticated = computed(() =>
    Boolean(this.tokenSignal())
  );

  readonly claims = computed(() =>
    this.decodeClaims(
      this.tokenSignal()
    )
  );

  readonly displayName = computed(() => {

    const claims =
      this.claims();

    return (
      claims?.['name'] ||
      claims?.['username'] ||
      claims?.['sub'] ||
      claims?.['email'] ||
      'Authenticated user'
    );
  });

  readonly initials = computed(() =>
    this.displayName()
      .split(/[ @._-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(part =>
        part.charAt(0).toUpperCase()
      )
      .join('') || 'U'
  );

  setToken(
    token: string
  ): void {

    TokenStorageUtil.saveToken(token);

    this.tokenSignal.set(token);
  }

  clear(): void {

    TokenStorageUtil.clearToken();

    this.tokenSignal.set(null);
  }

  getToken(): string | null {

    return this.tokenSignal();
  }

  private decodeClaims(
    token: string | null
  ): Record<string, string> | null {

    if (!token) {
      return null;
    }

    const payload =
      token.split('.')[1];

    if (!payload) {
      return null;
    }

    try {
      const normalized =
        payload
          .replace(/-/g, '+')
          .replace(/_/g, '/');

      return JSON.parse(
        atob(normalized)
      ) as Record<string, string>;
    } catch {
      return null;
    }
  }
}
