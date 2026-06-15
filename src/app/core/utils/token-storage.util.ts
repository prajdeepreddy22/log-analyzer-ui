const TOKEN_KEY = 'logai_token';
const LEGACY_READ_TOKEN_KEYS = [
  'token'
] as const;
const LEGACY_CLEANUP_TOKEN_KEYS = [
  ...LEGACY_READ_TOKEN_KEYS,
  'accessToken'
] as const;

export class TokenStorageUtil {

  static saveToken(token: string): void {
    const normalizedToken =
      this.normalizeToken(token);

    if (!normalizedToken) {
      this.clearToken();
      return;
    }

    localStorage.setItem(
      TOKEN_KEY,
      normalizedToken
    );

    LEGACY_CLEANUP_TOKEN_KEYS.forEach(key =>
      localStorage.removeItem(key)
    );
  }

  static getToken(): string | null {
    const storedToken =
      localStorage.getItem(TOKEN_KEY);

    if (storedToken) {
      return this.normalizeToken(storedToken);
    }

    for (const key of LEGACY_READ_TOKEN_KEYS) {
      const legacyToken =
        localStorage.getItem(key);

      if (!legacyToken) {
        continue;
      }

      const normalizedToken =
        this.normalizeToken(legacyToken);

      if (normalizedToken) {
        this.saveToken(normalizedToken);
        return normalizedToken;
      }
    }

    return null;
  }

  static clearToken(): void {
    localStorage.removeItem(TOKEN_KEY);

    LEGACY_CLEANUP_TOKEN_KEYS.forEach(key =>
      localStorage.removeItem(key)
    );
  }

  static hasToken(): boolean {
    return !!this.getToken();
  }

  private static normalizeToken(
    token: string
  ): string {

    return token
      .trim()
      .replace(/^Bearer\s+/i, '');
  }
}
