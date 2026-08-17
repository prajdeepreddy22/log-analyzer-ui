import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

import { ApiTokenApiService } from '../api/api-token-api.service';
import { ApiTokenStoreService } from './api-token-store.service';

describe('ApiTokenStoreService', () => {
  let store: ApiTokenStoreService;
  let api: jasmine.SpyObj<ApiTokenApiService>;

  beforeEach(() => {
    api = jasmine.createSpyObj<ApiTokenApiService>(
      'ApiTokenApiService',
      [
        'getTokens',
        'createToken',
        'revokeToken'
      ]
    );

    TestBed.configureTestingModule({
      providers: [
        ApiTokenStoreService,
        {
          provide: ApiTokenApiService,
          useValue: api
        }
      ]
    });

    store = TestBed.inject(ApiTokenStoreService);
  });

  it('loads active and revoked tokens', () => {
    api.getTokens.and.returnValue(of([
      {
        id: 1,
        scope: 'INGEST',
        name: 'active watcher',
        createdAt: '2026-08-17T10:00:00',
        lastUsedAt: null,
        revoked: false
      },
      {
        id: 2,
        scope: 'INGEST',
        name: 'old watcher',
        createdAt: '2026-08-16T10:00:00',
        lastUsedAt: null,
        revoked: true
      }
    ]));

    store.loadTokens();

    expect(store.tokens().length).toBe(2);
    expect(store.activeTokens().length).toBe(1);
    expect(store.revokedTokens().length).toBe(1);
  });

  it('keeps the raw generated token only in the copy-once state', () => {
    api.createToken.and.returnValue(of({
      id: 3,
      token: 'logai_live_raw',
      scope: 'INGEST',
      name: 'local watcher',
      createdAt: '2026-08-17T10:00:00',
      lastUsedAt: null,
      revoked: false,
      message: 'Token created. Copy it now.'
    }));

    store.createToken('local watcher');

    expect(store.createdToken()?.token).toBe('logai_live_raw');
    expect(store.tokens()[0].token).toBeNull();
  });

  it('marks a token revoked after backend success', () => {
    api.getTokens.and.returnValue(of([
      {
        id: 4,
        scope: 'INGEST',
        name: 'source watcher',
        createdAt: '2026-08-17T10:00:00',
        lastUsedAt: null,
        revoked: false
      }
    ]));
    api.revokeToken.and.returnValue(of({
      message: 'Token revoked successfully'
    }));

    store.loadTokens();
    store.revokeToken(4);

    expect(store.tokens()[0].revoked).toBeTrue();
    expect(store.success()).toBe('Token revoked successfully');
  });

  it('exposes readable backend errors', () => {
    api.getTokens.and.returnValue(
      throwError(() => new HttpErrorResponse({
        status: 500,
        error: {
          details: 'Server error'
        }
      }))
    );

    store.loadTokens();

    expect(store.error()).toBe('Server error');
  });
});
