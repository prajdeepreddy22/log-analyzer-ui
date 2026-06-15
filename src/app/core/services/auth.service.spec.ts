import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  provideRouter,
  Router
} from '@angular/router';

import { AuthService } from './auth.service';
import { UploadStoreService } from '../stores/upload-store.service';
import { AnalysisStoreService } from '../stores/analysis-store.service';
import { LogStoreService } from '../stores/log-store.service';
import { RateLimitStoreService } from '../stores/rate-limit-store.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideRouter([])
      ]
    });
    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('clears the session and redirects to login on logout', () => {
    const router =
      TestBed.inject(Router);

    const uploadStore =
      TestBed.inject(UploadStoreService);

    const analysisStore =
      TestBed.inject(AnalysisStoreService);

    const logStore =
      TestBed.inject(LogStoreService);

    const rateLimitStore =
      TestBed.inject(RateLimitStoreService);

    spyOn(uploadStore, 'reset').and.callThrough();
    spyOn(analysisStore, 'reset').and.callThrough();
    spyOn(logStore, 'reset').and.callThrough();
    spyOn(rateLimitStore, 'reset').and.callThrough();

    spyOn(router, 'navigate')
      .and.resolveTo(true);

    service.logout();

    expect(router.navigate)
      .toHaveBeenCalledWith(['/login']);

    expect(service.isLoggedIn())
      .toBeFalse();

    expect(uploadStore.reset).toHaveBeenCalled();
    expect(analysisStore.reset).toHaveBeenCalled();
    expect(logStore.reset).toHaveBeenCalled();
    expect(rateLimitStore.reset).toHaveBeenCalled();
  });
});
