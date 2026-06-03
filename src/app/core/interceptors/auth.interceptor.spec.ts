import { TestBed } from '@angular/core/testing';
import {
  HttpRequest,
  HttpResponse
} from '@angular/common/http';
import {
  HttpInterceptorFn
} from '@angular/common/http';
import { of } from 'rxjs';

import { authInterceptor } from './auth.interceptor';
import { AuthStoreService } from '../stores/auth-store.service';

describe('authInterceptor', () => {
  const runInterceptor: HttpInterceptorFn = (req, next) =>
    TestBed.runInInjectionContext(() =>
      authInterceptor(req, next)
    );

  let authStore: jasmine.SpyObj<AuthStoreService>;

  beforeEach(() => {
    authStore = jasmine.createSpyObj<AuthStoreService>(
      'AuthStoreService',
      ['getToken']
    );

    TestBed.configureTestingModule({
      providers: [
        {
          provide: AuthStoreService,
          useValue: authStore
        }
      ]
    });
  });

  it('adds bearer token to protected API requests', done => {
    authStore.getToken.and.returnValue('jwt-token');

    const request =
      new HttpRequest(
        'GET',
        'http://localhost:8080/api/uploads'
      );

    runInterceptor(request, req => {
      expect(
        req.headers.get('Authorization')
      ).toBe('Bearer jwt-token');

      return of(new HttpResponse());
    }).subscribe(() => done());
  });

  it('does not add bearer token to login requests', done => {
    authStore.getToken.and.returnValue('jwt-token');

    const request =
      new HttpRequest(
        'POST',
        'http://localhost:8080/api/auth/login',
        {}
      );

    runInterceptor(request, req => {
      expect(
        req.headers.has('Authorization')
      ).toBeFalse();

      return of(new HttpResponse());
    }).subscribe(() => done());
  });

  it('leaves requests unchanged when no token exists', done => {
    authStore.getToken.and.returnValue(null);

    const request =
      new HttpRequest(
        'GET',
        'http://localhost:8080/api/uploads'
      );

    runInterceptor(request, req => {
      expect(
        req.headers.has('Authorization')
      ).toBeFalse();

      return of(new HttpResponse());
    }).subscribe(() => done());
  });
});
