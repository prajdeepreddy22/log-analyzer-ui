import {
  Injectable,
  computed,
  effect,
  inject,
  signal
} from '@angular/core';

import { AnalysisStoreService } from '../stores/analysis-store.service';
import { LogSourceStoreService } from '../stores/log-source-store.service';
import { RateLimitStoreService } from '../stores/rate-limit-store.service';
import { RealtimeEventStoreService } from '../stores/realtime-event-store.service';
import { UploadStoreService } from '../stores/upload-store.service';

@Injectable({
  providedIn: 'root'
})
export class RealtimeUiSyncService {

  private readonly realtimeEvents =
    inject(RealtimeEventStoreService);

  private readonly uploadStore =
    inject(UploadStoreService);

  private readonly analysisStore =
    inject(AnalysisStoreService);

  private readonly rateLimitStore =
    inject(RateLimitStoreService);

  private readonly logSourceStore =
    inject(LogSourceStoreService);

  private readonly liveLogCount =
    signal(0);

  private readonly latestMessage =
    signal<string | null>(null);

  private lastLogIngestedTimestamp:
    string | null = null;

  private lastAnalysisStartedTimestamp:
    string | null = null;

  private lastAnalysisCompletedTimestamp:
    string | null = null;

  private lastIncidentChangedTimestamp:
    string | null = null;

  private sourceRefreshTimer:
    ReturnType<typeof setTimeout> | null = null;

  private uploadRefreshTimer:
    ReturnType<typeof setTimeout> | null = null;

  readonly newLiveLogCount = computed(() =>
    this.liveLogCount()
  );

  readonly hasNewLiveLogs = computed(() =>
    this.liveLogCount() > 0
  );

  readonly liveMessage = computed(() =>
    this.latestMessage()
  );

  constructor() {

    effect(() => {

      const event =
        this.realtimeEvents.logIngested();

      if (
        !event ||
        event.timestamp === this.lastLogIngestedTimestamp
      ) {
        return;
      }

      this.lastLogIngestedTimestamp =
        event.timestamp;

      queueMicrotask(() =>
        this.handleLogIngested(
          event.data.count
        )
      );
    });

    effect(() => {

      const event =
        this.realtimeEvents.analysisStarted();

      if (
        !event ||
        event.timestamp === this.lastAnalysisStartedTimestamp
      ) {
        return;
      }

      this.lastAnalysisStartedTimestamp =
        event.timestamp;

      queueMicrotask(() =>
        this.handleAnalysisStarted(
          event.data.uploadId
        )
      );
    });

    effect(() => {

      const event =
        this.realtimeEvents.analysisCompleted();

      if (
        !event ||
        event.timestamp === this.lastAnalysisCompletedTimestamp
      ) {
        return;
      }

      this.lastAnalysisCompletedTimestamp =
        event.timestamp;

      queueMicrotask(() =>
        this.handleAnalysisCompleted(
          event.data.uploadId,
          event.data.status
        )
      );
    });

    effect(() => {

      const event =
        this.realtimeEvents.incidentStatusChanged();

      if (
        !event ||
        event.timestamp === this.lastIncidentChangedTimestamp
      ) {
        return;
      }

      this.lastIncidentChangedTimestamp =
        event.timestamp;

      queueMicrotask(() =>
        this.latestMessage.set(
          `Incident ${event.data.toStatus.toLowerCase()}`
        )
      );
    });
  }

  start(): void {
    // Instantiating this singleton activates the signal effects above.
  }

  clearLiveLogBadge(): void {

    this.liveLogCount.set(0);

    if (
      this.latestMessage()?.includes('live log')
    ) {
      this.latestMessage.set(null);
    }
  }

  reset(): void {

    this.clearTimer(this.sourceRefreshTimer);
    this.clearTimer(this.uploadRefreshTimer);

    this.sourceRefreshTimer = null;
    this.uploadRefreshTimer = null;
    this.lastLogIngestedTimestamp = null;
    this.lastAnalysisStartedTimestamp = null;
    this.lastAnalysisCompletedTimestamp = null;
    this.lastIncidentChangedTimestamp = null;
    this.liveLogCount.set(0);
    this.latestMessage.set(null);
  }

  private handleLogIngested(
    count: number
  ): void {

    const safeCount =
      Math.max(count || 0, 0);

    if (safeCount <= 0) {
      return;
    }

    this.liveLogCount.update(value =>
      value + safeCount
    );

    this.latestMessage.set(
      `${safeCount} live log${safeCount === 1 ? '' : 's'} ingested`
    );

    this.queueSourceRefresh();
    this.queueUploadRefresh();
  }

  private handleAnalysisStarted(
    uploadId: string
  ): void {

    if (this.isSelectedUpload(uploadId)) {
      this.analysisStore.loadAnalysis(uploadId);
    }
  }

  private handleAnalysisCompleted(
    uploadId: string,
    status: string
  ): void {

    this.latestMessage.set(
      status === 'FAILED'
        ? 'Analysis failed'
        : 'Analysis completed'
    );

    this.rateLimitStore.refreshNow();
    this.queueUploadRefresh();

    if (this.isSelectedUpload(uploadId)) {
      this.analysisStore.loadAnalysis(uploadId);
    }
  }

  private queueSourceRefresh(): void {

    if (!this.logSourceStore.hasSources()) {
      return;
    }

    this.clearTimer(this.sourceRefreshTimer);

    this.sourceRefreshTimer =
      setTimeout(() => {
        this.sourceRefreshTimer = null;
        this.logSourceStore.loadSources();
      }, 700);
  }

  private queueUploadRefresh(): void {

    this.clearTimer(this.uploadRefreshTimer);

    this.uploadRefreshTimer =
      setTimeout(() => {
        this.uploadRefreshTimer = null;
        this.uploadStore.loadUploads();
      }, 700);
  }

  private isSelectedUpload(
    uploadId: string
  ): boolean {

    return Boolean(
      uploadId &&
      this.uploadStore.selectedUpload()?.uploadId === uploadId
    );
  }

  private clearTimer(
    timer: ReturnType<typeof setTimeout> | null
  ): void {

    if (timer) {
      clearTimeout(timer);
    }
  }
}
