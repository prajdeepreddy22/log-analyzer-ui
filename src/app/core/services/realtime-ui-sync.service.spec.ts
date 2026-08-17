import {
  TestBed,
  fakeAsync,
  flushMicrotasks,
  tick
} from '@angular/core/testing';
import {
  computed,
  signal
} from '@angular/core';

import { RealtimeUiSyncService } from './realtime-ui-sync.service';
import { RealtimeEventStoreService } from '../stores/realtime-event-store.service';
import { UploadStoreService } from '../stores/upload-store.service';
import { AnalysisStoreService } from '../stores/analysis-store.service';
import { RateLimitStoreService } from '../stores/rate-limit-store.service';
import { IncidentStoreService } from '../stores/incident-store.service';
import { LogSourceStoreService } from '../stores/log-source-store.service';
import { UploadStatus } from '../models/upload/upload-status.enum';
import { UploadResponseModel } from '../models/upload/upload-response.model';
import {
  AnalysisCompletedEventData,
  AnalysisStartedEventData,
  IncidentStatusChangedEventData,
  LogIngestedEventData,
  RealtimeEventModel
} from '../models/realtime/realtime-event.model';

describe('RealtimeUiSyncService', () => {
  let service: RealtimeUiSyncService;
  let realtimeEvents: {
    logIngested: ReturnType<typeof signal<RealtimeEventModel<LogIngestedEventData> | null>>;
    analysisStarted: ReturnType<typeof signal<RealtimeEventModel<AnalysisStartedEventData> | null>>;
    analysisCompleted: ReturnType<typeof signal<RealtimeEventModel<AnalysisCompletedEventData> | null>>;
    incidentStatusChanged: ReturnType<typeof signal<RealtimeEventModel<IncidentStatusChangedEventData> | null>>;
  };
  let uploadStore: jasmine.SpyObj<UploadStoreService> & {
    selectedUpload: ReturnType<typeof signal<UploadResponseModel | null>>;
  };
  let analysisStore: jasmine.SpyObj<AnalysisStoreService>;
  let rateLimitStore: jasmine.SpyObj<RateLimitStoreService>;
  let incidentStore: jasmine.SpyObj<IncidentStoreService>;
  let logSourceStore: jasmine.SpyObj<LogSourceStoreService> & {
    hasSources: ReturnType<typeof computed<boolean>>;
  };
  const hasSourcesSignal = signal(true);

  beforeEach(() => {
    realtimeEvents = {
      logIngested: signal(null),
      analysisStarted: signal(null),
      analysisCompleted: signal(null),
      incidentStatusChanged: signal(null)
    };

    uploadStore = jasmine.createSpyObj<UploadStoreService>(
      'UploadStoreService',
      ['loadUploads'],
      {
        selectedUpload: signal<UploadResponseModel | null>({
          uploadId: 'upload-1',
          fileName: 'app.log',
          fileSize: 2048,
          status: UploadStatus.COMPLETED,
          uploadTime: '2026-08-17T10:00:00',
          message: 'Upload completed'
        })
      }
    ) as jasmine.SpyObj<UploadStoreService> & {
      selectedUpload: ReturnType<typeof signal<UploadResponseModel | null>>;
    };

    analysisStore = jasmine.createSpyObj<AnalysisStoreService>(
      'AnalysisStoreService',
      ['loadAnalysis']
    );

    rateLimitStore = jasmine.createSpyObj<RateLimitStoreService>(
      'RateLimitStoreService',
      ['refreshNow']
    );

    incidentStore = jasmine.createSpyObj<IncidentStoreService>(
      'IncidentStoreService',
      ['refreshCurrentView']
    );

    logSourceStore = jasmine.createSpyObj<LogSourceStoreService>(
      'LogSourceStoreService',
      ['loadSources'],
      {
        hasSources: computed(() =>
          hasSourcesSignal()
        )
      }
    ) as jasmine.SpyObj<LogSourceStoreService> & {
      hasSources: ReturnType<typeof computed<boolean>>;
    };

    TestBed.configureTestingModule({
      providers: [
        RealtimeUiSyncService,
        {
          provide: RealtimeEventStoreService,
          useValue: realtimeEvents
        },
        {
          provide: UploadStoreService,
          useValue: uploadStore
        },
        {
          provide: AnalysisStoreService,
          useValue: analysisStore
        },
        {
          provide: RateLimitStoreService,
          useValue: rateLimitStore
        },
        {
          provide: IncidentStoreService,
          useValue: incidentStore
        },
        {
          provide: LogSourceStoreService,
          useValue: logSourceStore
        }
      ]
    });

    service = TestBed.inject(RealtimeUiSyncService);
  });

  it('tracks ingested log counts and refreshes summaries after a short debounce', fakeAsync(() => {
    realtimeEvents.logIngested.set({
      type: 'LOG_INGESTED',
      data: {
        sourceId: 12,
        count: 4
      },
      timestamp: '2026-08-17T10:00:00'
    });

    TestBed.flushEffects();
    flushMicrotasks();

    expect(service.newLiveLogCount()).toBe(4);
    expect(service.liveMessage()).toBe('4 live logs ingested');

    tick(700);

    expect(logSourceStore.loadSources).toHaveBeenCalled();
    expect(uploadStore.loadUploads).toHaveBeenCalled();
  }));

  it('reloads analysis only when realtime analysis events match the selected upload', fakeAsync(() => {
    realtimeEvents.analysisStarted.set({
      type: 'ANALYSIS_STARTED',
      data: {
        analysisId: 8,
        uploadId: 'upload-2'
      },
      timestamp: '2026-08-17T10:01:00'
    });

    TestBed.flushEffects();
    flushMicrotasks();

    expect(analysisStore.loadAnalysis).not.toHaveBeenCalled();

    realtimeEvents.analysisCompleted.set({
      type: 'ANALYSIS_COMPLETED',
      data: {
        analysisId: 9,
        uploadId: 'upload-1',
        status: 'COMPLETED',
        confidence: '0.920'
      },
      timestamp: '2026-08-17T10:02:00'
    });

    TestBed.flushEffects();
    flushMicrotasks();

    expect(rateLimitStore.refreshNow).toHaveBeenCalled();
    expect(analysisStore.loadAnalysis).toHaveBeenCalledWith('upload-1');

    tick(700);

    expect(uploadStore.loadUploads).toHaveBeenCalled();
  }));

  it('clears live state and pending refresh timers on reset', fakeAsync(() => {
    realtimeEvents.logIngested.set({
      type: 'LOG_INGESTED',
      data: {
        sourceId: 12,
        count: 2
      },
      timestamp: '2026-08-17T10:03:00'
    });

    TestBed.flushEffects();
    flushMicrotasks();

    service.reset();
    tick(700);

    expect(service.newLiveLogCount()).toBe(0);
    expect(service.liveMessage()).toBeNull();
    expect(uploadStore.loadUploads).not.toHaveBeenCalled();
  }));
});
