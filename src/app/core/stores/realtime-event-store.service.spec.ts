import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';

import { RealtimeEventModel } from '../models/realtime/realtime-event.model';
import { RealtimeEventSourceService } from '../services/realtime-event-source.service';
import { RealtimeEventStoreService } from './realtime-event-store.service';

describe('RealtimeEventStoreService', () => {
  let store: RealtimeEventStoreService;
  let source: jasmine.SpyObj<RealtimeEventSourceService>;
  let events$: Subject<RealtimeEventModel>;

  beforeEach(() => {
    events$ = new Subject<RealtimeEventModel>();

    source = jasmine.createSpyObj<RealtimeEventSourceService>(
      'RealtimeEventSourceService',
      [
        'connect',
        'close'
      ]
    );

    source.connect.and.returnValue(events$.asObservable());

    TestBed.configureTestingModule({
      providers: [
        RealtimeEventStoreService,
        {
          provide: RealtimeEventSourceService,
          useValue: source
        }
      ]
    });

    store = TestBed.inject(RealtimeEventStoreService);
  });

  it('connects once and marks the stream live after CONNECTED', () => {
    store.connect();
    store.connect();

    expect(source.connect).toHaveBeenCalledTimes(1);
    expect(store.connectionLabel()).toBe('CONNECTING');

    events$.next({
      type: 'CONNECTED',
      data: {
        message: 'Realtime stream connected'
      },
      timestamp: '2026-08-17T10:00:00'
    });

    expect(store.connected()).toBeTrue();
    expect(store.connectionLabel()).toBe('LIVE');
  });

  it('routes backend event types into typed signals', () => {
    store.connect();

    events$.next({
      type: 'LOG_INGESTED',
      data: {
        sourceId: 12,
        count: 3
      },
      timestamp: '2026-08-17T10:00:00'
    });

    events$.next({
      type: 'ANALYSIS_COMPLETED',
      data: {
        analysisId: 8,
        uploadId: 'upload-1',
        status: 'COMPLETED',
        confidence: '0.900'
      },
      timestamp: '2026-08-17T10:01:00'
    });

    events$.next({
      type: 'INCIDENT_STATUS_CHANGED',
      data: {
        incidentId: 'incident-1',
        fromStatus: 'OPEN',
        toStatus: 'INVESTIGATING'
      },
      timestamp: '2026-08-17T10:02:00'
    });

    expect(store.logIngested()?.data.count).toBe(3);
    expect(store.analysisCompleted()?.data.status).toBe('COMPLETED');
    expect(store.incidentStatusChanged()?.data.toStatus).toBe('INVESTIGATING');
  });

  it('disconnects and resets all realtime state', () => {
    store.connect();

    events$.next({
      type: 'ANALYSIS_STARTED',
      data: {
        analysisId: 4,
        uploadId: 'upload-1'
      },
      timestamp: '2026-08-17T10:00:00'
    });

    store.reset();

    expect(source.close).toHaveBeenCalled();
    expect(store.analysisStarted()).toBeNull();
    expect(store.connected()).toBeFalse();
    expect(store.connectionLabel()).toBe('IDLE');
  });
});
