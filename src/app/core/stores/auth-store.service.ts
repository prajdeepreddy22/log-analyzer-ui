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
    this.hasValidToken(
      this.tokenSignal()
    )
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
      this.claimText(claims, 'name') ||
      this.claimText(claims, 'username') ||
      this.claimText(claims, 'sub') ||
      this.claimText(claims, 'email') ||
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
      this.claimText(claims, 'username') ||
      this.claimText(claims, 'email') ||
      this.claimText(claims, 'sub') ||
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

    const token =
      this.tokenSignal();

    if (!this.hasValidToken(token)) {

      if (token) {
        this.clear();
      }

      return null;
    }

    return token;
  }

  private decodeClaims(
    token: string | null
  ): Record<string, unknown> | null {

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

      const padded =
        normalized.padEnd(
          Math.ceil(normalized.length / 4) * 4,
          '='
        );

      return JSON.parse(
        atob(padded)
      ) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  private hasValidToken(
    token: string | null
  ): boolean {

    if (!token) {
      return false;
    }

    const claims =
      this.decodeClaims(token);

    if (!claims) {
      return false;
    }

    const expiresAt =
      claims?.['exp'];

    if (typeof expiresAt !== 'number') {
      return true;
    }

    return expiresAt * 1000 >
      Date.now();
  }

  private claimText(
    claims: Record<string, unknown> | null,
    key: string
  ): string {

    const value =
      claims?.[key];

    return typeof value === 'string'
      ? value
      : '';
  }
}
