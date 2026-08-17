import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { LogSourceApiService } from '../api/log-source-api.service';
import { LogSourceStoreService } from './log-source-store.service';

describe('LogSourceStoreService', () => {
  let store: LogSourceStoreService;
  let api: jasmine.SpyObj<LogSourceApiService>;

  beforeEach(() => {
    api = jasmine.createSpyObj<LogSourceApiService>(
      'LogSourceApiService',
      [
        'getSources',
        'createSource',
        'updateStatus'
      ]
    );

    TestBed.configureTestingModule({
      providers: [
        LogSourceStoreService,
        {
          provide: LogSourceApiService,
          useValue: api
        }
      ]
    });

    store = TestBed.inject(LogSourceStoreService);
  });

  it('loads active and inactive log sources', () => {
    api.getSources.and.returnValue(of([
      {
        id: 1,
        sourceName: 'active watcher',
        sourceType: 'WATCHER',
        status: 'ACTIVE',
        internalUploadId: null,
        lastIngestedAt: null
      },
      {
        id: 2,
        sourceName: 'paused integration',
        sourceType: 'INTEGRATION',
        status: 'INACTIVE',
        internalUploadId: null,
        lastIngestedAt: null
      }
    ]));

    store.loadSources();

    expect(store.sources().length).toBe(2);
    expect(store.activeSources().length).toBe(1);
    expect(store.inactiveSources().length).toBe(1);
  });

  it('creates a source at the top of the list', () => {
    api.createSource.and.returnValue(of({
      id: 3,
      sourceName: 'local watcher',
      sourceType: 'WATCHER',
      status: 'ACTIVE',
      internalUploadId: null,
      lastIngestedAt: null
    }));

    store.createSource('local watcher', 'WATCHER');

    expect(api.createSource).toHaveBeenCalledWith({
      sourceName: 'local watcher',
      sourceType: 'WATCHER'
    });
    expect(store.sources()[0].id).toBe(3);
    expect(store.success()).toBe('Log source created successfully.');
  });

  it('updates source status after backend success', () => {
    const source = {
      id: 4,
      sourceName: 'payment watcher',
      sourceType: 'WATCHER' as const,
      status: 'ACTIVE' as const,
      internalUploadId: null,
      lastIngestedAt: null
    };

    api.getSources.and.returnValue(of([source]));
    api.updateStatus.and.returnValue(of({
      ...source,
      status: 'INACTIVE'
    }));

    store.loadSources();
    store.updateStatus(source, 'INACTIVE');

    expect(api.updateStatus).toHaveBeenCalledWith(4, 'INACTIVE');
    expect(store.sources()[0].status).toBe('INACTIVE');
  });

  it('exposes readable backend errors', () => {
    api.getSources.and.returnValue(
      throwError(() => new HttpErrorResponse({
        status: 400,
        error: {
          details: 'sourceName is required'
        }
      }))
    );

    store.loadSources();

    expect(store.error()).toBe('sourceName is required');
  });
});
