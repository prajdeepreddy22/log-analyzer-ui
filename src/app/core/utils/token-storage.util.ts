const TOKEN_KEY = 'logai_token';

export class TokenStorageUtil {

  static saveToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  }

  static getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  static clearToken(): void {
    localStorage.removeItem(TOKEN_KEY);
  }

  static hasToken(): boolean {
    return !!localStorage.getItem(TOKEN_KEY);
  }
}