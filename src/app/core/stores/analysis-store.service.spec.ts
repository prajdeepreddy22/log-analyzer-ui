import {
  TestBed,
  fakeAsync,
  tick
} from '@angular/core/testing';

import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';

import {
  provideHttpClient
} from '@angular/common/http';

import { AnalysisStoreService } from './analysis-store.service';
import { RateLimitStoreService } from './rate-limit-store.service';
import { environment } from '../../../environments/environment';

describe('AnalysisStoreService', () => {
  let service: AnalysisStoreService;
  let httpMock: HttpTestingController;
  let rateLimitStore:
    jasmine.SpyObj<RateLimitStoreService>;

  beforeEach(() => {
    rateLimitStore =
      jasmine.createSpyObj<RateLimitStoreService>(
        'RateLimitStoreService',
        ['refreshNow']
      );

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: RateLimitStoreService,
          useValue: rateLimitStore
        }
      ]
    });

    service = TestBed.inject(AnalysisStoreService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    service.stopPolling();
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('polls queued analysis until completed and then loads result', fakeAsync(() => {
    service.triggerAnalysis('upload-1');

    const triggerRequest =
      httpMock.expectOne(
        `${environment.apiBaseUrl}/analysis/upload-1?force=false`
      );

    triggerRequest.flush({
      analysis_status: 'QUEUED',
      message: 'Analysis queued'
    });

    expect(service.analysis()).toBeNull();
    expect(service.status()).toBe('QUEUED');
    expect(service.statusMessage()).toBe('Analysis queued');
    expect(service.isProcessing()).toBeTrue();

    const firstStatusRequest =
      httpMock.expectOne(
        `${environment.apiBaseUrl}/analysis/upload-1/status`
      );

    firstStatusRequest.flush({
      analysis_status: 'PROCESSING',
      message: 'AI is analyzing logs'
    });

    expect(service.status()).toBe('PROCESSING');
    expect(service.statusMessage()).toBe('AI is analyzing logs');

    tick(2500);

    const completedStatusRequest =
      httpMock.expectOne(
        `${environment.apiBaseUrl}/analysis/upload-1/status`
      );

    completedStatusRequest.flush({
      status: 'COMPLETED',
      message: 'Analysis ready'
    });

    const resultRequest =
      httpMock.expectOne(
        `${environment.apiBaseUrl}/analysis/upload-1`
      );

    resultRequest.flush({
      summary: 'Auth service failed',
      rootCause: 'NullPointerException',
      developerMistake: 'Missing null guard',
      fixSuggestion: 'Validate user lookup',
      codeFix: 'if (user == null) throw ...;',
      severityScore: 4,
      status: 'COMPLETED'
    });

    expect(service.status()).toBe('COMPLETED');
    expect(service.isProcessing()).toBeFalse();
    expect(service.analysis()?.summary).toBe(
      'Auth service failed'
    );

    expect(rateLimitStore.refreshNow)
      .toHaveBeenCalled();
  }));

  it('polls when the trigger endpoint returns an empty accepted response', fakeAsync(() => {
    service.triggerAnalysis('upload-2');

    httpMock.expectOne(
      `${environment.apiBaseUrl}/analysis/upload-2?force=false`
    ).flush(null);

    expect(service.status()).toBe('QUEUED');
    expect(service.isProcessing()).toBeTrue();

    httpMock.expectOne(
      `${environment.apiBaseUrl}/analysis/upload-2/status`
    ).flush({
      status: 'PROCESSING'
    });

    service.stopPolling();
  }));

  it('shows the backend analysis error message when status is failed', fakeAsync(() => {
    service.triggerAnalysis('upload-3');

    httpMock.expectOne(
      `${environment.apiBaseUrl}/analysis/upload-3?force=false`
    ).flush({
      status: 'FAILED',
      errorMessage: 'OpenAI API key is not configured'
    });

    expect(service.status()).toBe('FAILED');
    expect(service.error()).toBe(
      'OpenAI API key is not configured'
    );
  }));

  it('uses the confirmed failure-field priority', fakeAsync(() => {
    service.triggerAnalysis('upload-4');

    httpMock.expectOne(
      `${environment.apiBaseUrl}/analysis/upload-4?force=false`
    ).flush({
      status: 'FAILED',
      message: 'Analysis failed',
      error_message: 'Provider temporarily unavailable',
      errorMessage: 'AI provider timed out'
    });

    expect(service.error()).toBe(
      'AI provider timed out'
    );
  }));

  it('stops polling when status is NOT_STARTED', fakeAsync(() => {
    service.loadStatusThenAnalysis('upload-not-started');

    httpMock.expectOne(
      `${environment.apiBaseUrl}/analysis/upload-not-started/status`
    ).flush({
      status: 'NOT_STARTED',
      message: 'Analysis has not started'
    });

    tick(5000);

    httpMock.expectNone(
      `${environment.apiBaseUrl}/analysis/upload-not-started/status`
    );

    expect(service.status()).toBe('NOT_STARTED');
    expect(service.isProcessing()).toBeFalse();
  }));

  it('stops polling on 404 and reports an unavailable resource', fakeAsync(() => {
    service.triggerAnalysis('missing-upload');

    httpMock.expectOne(
      `${environment.apiBaseUrl}/analysis/missing-upload?force=false`
    ).flush({
      status: 'QUEUED'
    });

    httpMock.expectOne(
      `${environment.apiBaseUrl}/analysis/missing-upload/status`
    ).flush(
      {
        details: 'Upload not found'
      },
      {
        status: 404,
        statusText: 'Not Found'
      }
    );

    tick(5000);

    httpMock.expectNone(
      `${environment.apiBaseUrl}/analysis/missing-upload/status`
    );

    expect(service.status()).toBeNull();
    expect(service.error()).toBe(
      'The requested upload is unavailable.'
    );
    expect(service.isProcessing()).toBeFalse();
  }));

  it('does not convert an initial 404 into NOT_STARTED', () => {
    service.loadStatusThenAnalysis('deleted-upload');

    httpMock.expectOne(
      `${environment.apiBaseUrl}/analysis/deleted-upload/status`
    ).flush(
      {
        message: 'Upload not found'
      },
      {
        status: 404,
        statusText: 'Not Found'
      }
    );

    expect(service.status()).toBeNull();
    expect(service.error()).toBe(
      'The requested upload is unavailable.'
    );
  });

  it('loads cached analysis results immediately', fakeAsync(() => {
    service.triggerAnalysis('upload-5');

    httpMock.expectOne(
      `${environment.apiBaseUrl}/analysis/upload-5?force=false`
    ).flush({
      status: 'CACHED',
      message: 'Cached analysis returned'
    });

    httpMock.expectOne(
      `${environment.apiBaseUrl}/analysis/upload-5`
    ).flush({
      analysisStatus: 'COMPLETED',
      summary: 'Cached result'
    });

    expect(service.status()).toBe('COMPLETED');
    expect(service.analysis()?.summary).toBe(
      'Cached result'
    );
  }));

  it('normalizes RETRY trigger status and continues polling', fakeAsync(() => {
    service.triggerAnalysis('upload-6');

    httpMock.expectOne(
      `${environment.apiBaseUrl}/analysis/upload-6?force=false`
    ).flush({
      status: 'RETRY',
      message: 'Retry queued'
    });

    expect(service.status()).toBe('RETRYING');
    expect(service.isProcessing()).toBeTrue();

    httpMock.expectOne(
      `${environment.apiBaseUrl}/analysis/upload-6/status`
    ).flush({
      status: 'PROCESSING'
    });

    service.stopPolling();
  }));
});
