import {
  TestBed
} from '@angular/core/testing';

import { AuthStoreService } from './auth-store.service';

describe('AuthStoreService', () => {
  let service: AuthStoreService;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({});

    service =
      TestBed.inject(AuthStoreService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('accepts a non-expired JWT', () => {
    service.setToken(
      createToken(
        Math.floor(Date.now() / 1000) + 60
      )
    );

    expect(service.isAuthenticated()).toBeTrue();
    expect(service.getToken()).not.toBeNull();
  });

  it('rejects and clears an expired JWT', () => {
    service.setToken(
      createToken(
        Math.floor(Date.now() / 1000) - 60
      )
    );

    expect(service.isAuthenticated()).toBeFalse();
    expect(service.getToken()).toBeNull();
    expect(
      localStorage.getItem('logai_token')
    ).toBeNull();
  });

  it('rejects and clears a malformed JWT', () => {
    service.setToken('not-a-jwt');

    expect(service.isAuthenticated()).toBeFalse();
    expect(service.getToken()).toBeNull();
    expect(
      localStorage.getItem('logai_token')
    ).toBeNull();
  });
});

function createToken(
  expiresAt: number
): string {

  const encode = (
    value: object
  ): string =>
    btoa(JSON.stringify(value))
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

  return [
    encode({
      alg: 'none',
      typ: 'JWT'
    }),
    encode({
      sub: 'user',
      exp: expiresAt
    }),
    ''
  ].join('.');
}
