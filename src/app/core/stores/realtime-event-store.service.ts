import {
  Injectable,
  computed,
  inject,
  signal
} from '@angular/core';

import {
  Subscription
} from 'rxjs';

import { RealtimeEventSourceService } from '../services/realtime-event-source.service';
import {
  AnalysisCompletedEventData,
  AnalysisStartedEventData,
  IncidentStatusChangedEventData,
  LogIngestedEventData,
  RealtimeConnectedData,
  RealtimeEventModel
} from '../models/realtime/realtime-event.model';

@Injectable({
  providedIn: 'root'
})
export class RealtimeEventStoreService {

  private readonly realtimeSource =
    inject(RealtimeEventSourceService);

  private connection:
    Subscription | null = null;

  readonly connected =
    signal(false);

  readonly connecting =
    signal(false);

  readonly error =
    signal<string | null>(null);

  readonly lastEvent =
    signal<RealtimeEventModel | null>(null);

  readonly logIngested =
    signal<RealtimeEventModel<LogIngestedEventData> | null>(null);

  readonly analysisStarted =
    signal<RealtimeEventModel<AnalysisStartedEventData> | null>(null);

  readonly analysisCompleted =
    signal<RealtimeEventModel<AnalysisCompletedEventData> | null>(null);

  readonly incidentStatusChanged =
    signal<RealtimeEventModel<IncidentStatusChangedEventData> | null>(null);

  readonly connectionLabel = computed(() => {

    if (this.connecting()) {
      return 'CONNECTING';
    }

    if (this.connected()) {
      return 'LIVE';
    }

    if (this.error()) {
      return 'OFFLINE';
    }

    return 'IDLE';
  });

  connect(): void {

    if (this.connection) {
      return;
    }

    this.connecting.set(true);
    this.error.set(null);

    this.connection =
      this.realtimeSource
        .connect()
        .subscribe({

          next: event => {
            this.connecting.set(false);
            this.error.set(null);
            this.lastEvent.set(event);
            this.routeEvent(event);
          },

          error: error => {
            this.connecting.set(false);
            this.connected.set(false);
            this.connection = null;
            this.error.set(
              error instanceof Error
                ? error.message
                : 'Realtime connection failed.'
            );
          },

          complete: () => {
            this.connecting.set(false);
            this.connected.set(false);
            this.connection = null;
          }
        });
  }

  disconnect(): void {

    this.connection?.unsubscribe();
    this.connection = null;
    this.realtimeSource.close();
    this.connecting.set(false);
    this.connected.set(false);
  }

  reset(): void {

    this.disconnect();
    this.error.set(null);
    this.lastEvent.set(null);
    this.logIngested.set(null);
    this.analysisStarted.set(null);
    this.analysisCompleted.set(null);
    this.incidentStatusChanged.set(null);
  }

  private routeEvent(
    event: RealtimeEventModel
  ): void {

    switch (event.type) {

      case 'CONNECTED':
        this.connected.set(true);
        break;

      case 'LOG_INGESTED':
        this.logIngested.set(
          event as RealtimeEventModel<LogIngestedEventData>
        );
        break;

      case 'ANALYSIS_STARTED':
        this.analysisStarted.set(
          event as RealtimeEventModel<AnalysisStartedEventData>
        );
        break;

      case 'ANALYSIS_COMPLETED':
        this.analysisCompleted.set(
          event as RealtimeEventModel<AnalysisCompletedEventData>
        );
        break;

      case 'INCIDENT_STATUS_CHANGED':
        this.incidentStatusChanged.set(
          event as RealtimeEventModel<IncidentStatusChangedEventData>
        );
        break;
    }
  }

}
