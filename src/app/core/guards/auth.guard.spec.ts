import {
  TestBed
} from '@angular/core/testing';
import {
  provideRouter,
  Router,
  UrlTree
} from '@angular/router';

import { authGuard } from './auth.guard';
import { AuthStoreService } from '../stores/auth-store.service';

describe('authGuard', () => {
  let authStore:
    jasmine.SpyObj<AuthStoreService>;

  beforeEach(() => {
    authStore =
      jasmine.createSpyObj<AuthStoreService>(
        'AuthStoreService',
        [
          'isAuthenticated',
          'clear'
        ]
      );

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthStoreService,
          useValue: authStore
        }
      ]
    });
  });

  it('allows authenticated users', () => {
    authStore.isAuthenticated
      .and.returnValue(true);

    const result =
      TestBed.runInInjectionContext(() =>
        authGuard(
          {} as never,
          {
            url: '/dashboard'
          } as never
        )
      );

    expect(result).toBeTrue();
  });

  it('clears invalid auth and redirects to login', () => {
    authStore.isAuthenticated
      .and.returnValue(false);

    const result =
      TestBed.runInInjectionContext(() =>
        authGuard(
          {} as never,
          {
            url: '/uploads'
          } as never
        )
      );

    expect(authStore.clear)
      .toHaveBeenCalled();

    expect(result instanceof UrlTree)
      .toBeTrue();

    expect(
      TestBed.inject(Router)
        .serializeUrl(result as UrlTree)
    ).toBe('/login?returnUrl=%2Fuploads');
  });
});
