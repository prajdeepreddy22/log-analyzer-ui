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
import { environment } from '../../../environments/environment';

describe('AnalysisStoreService', () => {
  let service: AnalysisStoreService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
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
  }));
});
