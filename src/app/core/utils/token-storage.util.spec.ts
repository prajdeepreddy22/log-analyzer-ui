import { TokenStorageUtil } from './token-storage.util';

describe('TokenStorageUtil', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('stores and reads the JWT token using the app key', () => {
    TokenStorageUtil.saveToken('jwt-token');

    expect(TokenStorageUtil.getToken()).toBe('jwt-token');
    expect(localStorage.getItem('logai_token')).toBe('jwt-token');
    expect(TokenStorageUtil.hasToken()).toBeTrue();
  });

  it('clears the JWT token', () => {
    TokenStorageUtil.saveToken('jwt-token');

    TokenStorageUtil.clearToken();

    expect(TokenStorageUtil.getToken()).toBeNull();
    expect(TokenStorageUtil.hasToken()).toBeFalse();
  });

  it('migrates a legacy token storage key', () => {
    localStorage.setItem(
      'token',
      'legacy-jwt-token'
    );

    expect(
      TokenStorageUtil.getToken()
    ).toBe('legacy-jwt-token');

    expect(
      localStorage.getItem('logai_token')
    ).toBe('legacy-jwt-token');

    expect(
      localStorage.getItem('token')
    ).toBeNull();
  });

  it('removes an accidental Bearer prefix before storage', () => {
    TokenStorageUtil.saveToken(
      'Bearer jwt-token'
    );

    expect(
      TokenStorageUtil.getToken()
    ).toBe('jwt-token');
  });
});
