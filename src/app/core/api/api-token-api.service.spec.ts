import {
  provideHttpClient
} from '@angular/common/http';

import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';

import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { ApiTokenApiService } from './api-token-api.service';

describe('ApiTokenApiService', () => {
  let service: ApiTokenApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(ApiTokenApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('lists ingestion tokens from the settings endpoint', () => {
    service.getTokens().subscribe(tokens => {
      expect(tokens.length).toBe(1);
      expect(tokens[0].name).toBe('watcher');
    });

    const request = httpMock.expectOne(
      `${environment.apiBaseUrl}/settings/tokens`
    );

    expect(request.request.method).toBe('GET');

    request.flush([
      {
        id: 1,
        scope: 'INGEST',
        name: 'watcher',
        createdAt: '2026-08-17T10:00:00',
        lastUsedAt: null,
        revoked: false
      }
    ]);
  });

  it('creates and revokes ingestion tokens', () => {
    service.createToken({ name: 'local watcher' })
      .subscribe(token => {
        expect(token.token).toBe('logai_live_raw');
      });

    const createRequest = httpMock.expectOne(
      `${environment.apiBaseUrl}/settings/tokens`
    );

    expect(createRequest.request.method).toBe('POST');
    expect(createRequest.request.body).toEqual({
      name: 'local watcher'
    });

    createRequest.flush({
      id: 2,
      token: 'logai_live_raw',
      scope: 'INGEST',
      name: 'local watcher',
      createdAt: '2026-08-17T10:00:00',
      lastUsedAt: null,
      revoked: false,
      message: 'Token created. Copy it now because it will not be shown again.'
    });

    service.revokeToken(2).subscribe(response => {
      expect(response.message).toBe('Token revoked successfully');
    });

    const deleteRequest = httpMock.expectOne(
      `${environment.apiBaseUrl}/settings/tokens/2`
    );

    expect(deleteRequest.request.method).toBe('DELETE');

    deleteRequest.flush({
      message: 'Token revoked successfully'
    });
  });
});
