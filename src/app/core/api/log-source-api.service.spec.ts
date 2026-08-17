import {
  provideHttpClient
} from '@angular/common/http';

import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';

import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { LogSourceApiService } from './log-source-api.service';

describe('LogSourceApiService', () => {
  let service: LogSourceApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(LogSourceApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('lists log sources from the backend endpoint', () => {
    service.getSources().subscribe(sources => {
      expect(sources.length).toBe(1);
      expect(sources[0].sourceName).toBe('payment watcher');
    });

    const request = httpMock.expectOne(
      `${environment.apiBaseUrl}/log-sources`
    );

    expect(request.request.method).toBe('GET');

    request.flush([
      {
        id: 1,
        sourceName: 'payment watcher',
        sourceType: 'WATCHER',
        status: 'ACTIVE',
        internalUploadId: 'upload-1',
        lastIngestedAt: null
      }
    ]);
  });

  it('creates and updates log source status', () => {
    service.createSource({
      sourceName: 'local watcher',
      sourceType: 'WATCHER'
    }).subscribe(source => {
      expect(source.status).toBe('ACTIVE');
    });

    const createRequest = httpMock.expectOne(
      `${environment.apiBaseUrl}/log-sources`
    );

    expect(createRequest.request.method).toBe('POST');
    expect(createRequest.request.body).toEqual({
      sourceName: 'local watcher',
      sourceType: 'WATCHER'
    });

    createRequest.flush({
      id: 2,
      sourceName: 'local watcher',
      sourceType: 'WATCHER',
      status: 'ACTIVE',
      internalUploadId: null,
      lastIngestedAt: null
    });

    service.updateStatus(2, 'INACTIVE')
      .subscribe(source => {
        expect(source.status).toBe('INACTIVE');
      });

    const patchRequest = httpMock.expectOne(
      `${environment.apiBaseUrl}/log-sources/2`
    );

    expect(patchRequest.request.method).toBe('PATCH');
    expect(patchRequest.request.body).toEqual({
      status: 'INACTIVE'
    });

    patchRequest.flush({
      id: 2,
      sourceName: 'local watcher',
      sourceType: 'WATCHER',
      status: 'INACTIVE',
      internalUploadId: null,
      lastIngestedAt: null
    });
  });
});
