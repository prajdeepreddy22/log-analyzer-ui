import {
  HttpErrorResponse,
  HttpRequest
} from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ToastrService } from 'ngx-toastr';
import { throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

import { apiErrorInterceptor } from './api-error.interceptor';
import { AuthStoreService } from '../stores/auth-store.service';
import { SessionEventsService } from '../services/session-events.service';

describe('apiErrorInterceptor', () => {
  let authStore:
    jasmine.SpyObj<AuthStoreService>;

  let sessionEvents:
    jasmine.SpyObj<SessionEventsService>;

  beforeEach(() => {
    authStore =
      jasmine.createSpyObj<AuthStoreService>(
        'AuthStoreService',
        [
          'clear',
          'isAuthenticated'
        ]
      );

    sessionEvents =
      jasmine.createSpyObj<SessionEventsService>(
        'SessionEventsService',
        ['notifyExpired']
      );

    TestBed.configureTestingModule({
      providers: [
        {
          provide: AuthStoreService,
          useValue: authStore
        },
        {
          provide: SessionEventsService,
          useValue: sessionEvents
        },
        {
          provide: ToastrService,
          useValue: jasmine.createSpyObj(
            'ToastrService',
            ['error']
          )
        }
      ]
    });
  });

  it('clears auth and emits session expiry on a 401 response', done => {
    authStore.isAuthenticated.and.returnValue(true);

    const request =
      new HttpRequest(
        'GET',
        `${environment.apiBaseUrl}/uploads`
      );

    TestBed.runInInjectionContext(() =>
      apiErrorInterceptor(
        request,
        () => throwError(() =>
          new HttpErrorResponse({
            status: 401,
            error: {
              errorMessage: 'Invalid JWT'
            }
          })
        )
      )
    ).subscribe({
      error: () => {
        expect(authStore.clear)
          .toHaveBeenCalled();

        expect(sessionEvents.notifyExpired)
          .toHaveBeenCalled();

        done();
      }
    });
  });

  it('does not emit session expiry for invalid login credentials', done => {
    authStore.isAuthenticated.and.returnValue(false);

    const request =
      new HttpRequest(
        'POST',
        `${environment.apiBaseUrl}/auth/login`,
        {}
      );

    TestBed.runInInjectionContext(() =>
      apiErrorInterceptor(
        request,
        () => throwError(() =>
          new HttpErrorResponse({
            status: 401
          })
        )
      )
    ).subscribe({
      error: () => {
        expect(authStore.clear)
          .not.toHaveBeenCalled();

        expect(sessionEvents.notifyExpired)
          .not.toHaveBeenCalled();

        done();
      }
    });
  });

  it('does not treat lazy asset failures as backend API errors', done => {
    const toastr =
      TestBed.inject(ToastrService) as
        jasmine.SpyObj<ToastrService>;

    const request =
      new HttpRequest(
        'GET',
        '/chunk-missing.js'
      );

    TestBed.runInInjectionContext(() =>
      apiErrorInterceptor(
        request,
        () => throwError(() =>
          new HttpErrorResponse({
            status: 404
          })
        )
      )
    ).subscribe({
      error: () => {
        expect(toastr.error)
          .not.toHaveBeenCalled();

        expect(sessionEvents.notifyExpired)
          .not.toHaveBeenCalled();

        done();
      }
    });
  });
});
