import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { LogApiService } from './log-api.service';
import { environment } from '../../../environments/environment';
import { LogLevel } from '../models/log/log-level.enum';
import { LogSearchRequestModel } from '../models/log/log-search-request.model';

describe('LogApiService', () => {
  let service: LogApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(LogApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('requests paged logs with backend sort query params', () => {
    service
      .getLogs('upload-1', 2, 50, 'logTimestamp', 'desc')
      .subscribe(response => {
        expect(response.page).toBe(2);
        expect(response.content.length).toBe(0);
      });

    const req = httpMock.expectOne(request =>
      request.url === `${environment.apiBaseUrl}/logs/upload-1`
    );

    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('size')).toBe('50');
    expect(req.request.params.get('sortBy')).toBe('logTimestamp');
    expect(req.request.params.get('direction')).toBe('desc');

    req.flush({
      content: [],
      page: 2,
      size: 50,
      totalElements: 0,
      totalPages: 0
    });
  });

  it('uses the backend POST search endpoint and request body', () => {
    const body: LogSearchRequestModel = {
      keyword: 'NullPointerException',
      level: LogLevel.ERROR,
      serviceName: 'AuthService',
      page: 0,
      size: 20,
      sortBy: 'logTimestamp',
      direction: 'desc'
    };

    service.searchLogs('upload-2', body).subscribe();

    const req = httpMock.expectOne(
      `${environment.apiBaseUrl}/logs/search/upload-2`
    );

    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);

    req.flush({
      content: [],
      page: 0,
      size: 20,
      totalElements: 0,
      totalPages: 0
    });
  });

  it('requests log stats for an upload', () => {
    service.getLogStats('upload-3').subscribe(stats => {
      expect(stats.totalLogs).toBe(10);
      expect(stats.errorCount).toBe(2);
    });

    const req = httpMock.expectOne(
      `${environment.apiBaseUrl}/logs/upload-3/stats`
    );

    expect(req.request.method).toBe('GET');

    req.flush({
      totalLogs: 10,
      errorCount: 2,
      warnCount: 1,
      infoCount: 7,
      debugCount: 0
    });
  });
});
