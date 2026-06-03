import {
  Injectable,
  computed,
  signal
} from '@angular/core';

import { TokenStorageUtil } from '../utils/token-storage.util';
import { AuthUserModel } from '../models/auth/auth-user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthStoreService {

  private readonly tokenSignal =
    signal<string | null>(
      TokenStorageUtil.getToken()
    );

  private readonly userSignal =
    signal<AuthUserModel | null>(null);

  readonly token = computed(() =>
    this.tokenSignal()
  );

  readonly user = computed(() =>
    this.userSignal()
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

    const user =
      this.userSignal();

    const claims =
      this.claims();

    return (
      user?.displayName ||
      user?.fullName ||
      user?.username ||
      user?.email ||
      claims?.['name'] ||
      claims?.['username'] ||
      claims?.['sub'] ||
      claims?.['email'] ||
      'Authenticated user'
    );
  });

  readonly accountSubtitle = computed(() => {

    const user =
      this.userSignal();

    const claims =
      this.claims();

    return (
      user?.username ||
      user?.email ||
      claims?.['username'] ||
      claims?.['email'] ||
      claims?.['sub'] ||
      ''
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

  setUser(
    user: AuthUserModel | null
  ): void {

    this.userSignal.set(user);
  }

  patchUser(
    patch: Partial<AuthUserModel>
  ): void {

    this.userSignal.update(user => ({
      ...(user ?? {}),
      ...patch
    }));
  }

  clear(): void {

    TokenStorageUtil.clearToken();

    this.tokenSignal.set(null);
    this.userSignal.set(null);
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
