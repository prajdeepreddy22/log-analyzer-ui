import {
  Injectable,
  inject
} from '@angular/core';

import {
  Observable
} from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthStoreService } from '../stores/auth-store.service';
import {
  RealtimeEventModel,
  RealtimeEventType
} from '../models/realtime/realtime-event.model';

export class RealtimeStreamError extends Error {

  constructor(
    message: string,
    readonly status?: number
  ) {
    super(message);
    this.name = 'RealtimeStreamError';
  }
}

@Injectable({
  providedIn: 'root'
})
export class RealtimeEventSourceService {

  private static readonly reconnectDelayMs = 3_000;

  private readonly authStore =
    inject(AuthStoreService);

  private activeSource:
    EventSource | null = null;

  private reconnectTimer:
    ReturnType<typeof setTimeout> | null = null;

  private explicitlyClosed = false;

  close(): void {

    this.explicitlyClosed = true;
    this.clearReconnectTimer();
    this.activeSource?.close();
    this.activeSource = null;
  }

  connect(): Observable<RealtimeEventModel> {

    this.close();
    this.explicitlyClosed = false;

    return new Observable<RealtimeEventModel>(
      observer => {

        const token =
          this.authStore.getToken();

        if (!token) {
          observer.error(
            new RealtimeStreamError(
              'Your session expired. Please log in again.',
              401
            )
          );
          return undefined;
        }

        let closed = false;

        const closeSource = (): void => {

          if (closed) {
            return;
          }

          closed = true;

          if (this.activeSource === source) {
            this.activeSource = null;
          }

          source.close();
        };

        let source: EventSource;

        const openSource = (): void => {

          if (closed || this.explicitlyClosed) {
            return;
          }

          const params =
            new URLSearchParams({ token });

          source =
            new EventSource(
              `${environment.apiBaseUrl}/events/stream?${params.toString()}`
            );

          this.activeSource = source;

          this.eventTypes().forEach(type => {
            source.addEventListener(
              type,
              event =>
                handleEvent(event as MessageEvent<string>)
            );
          });

          source.onerror = () => {

            if (closed || this.explicitlyClosed) {
              return;
            }

            source.close();

            if (this.activeSource === source) {
              this.activeSource = null;
            }

            this.scheduleReconnect(openSource);
          };
        };

        const handleEvent = (
          event: MessageEvent<string>
        ): void => {

          try {
            observer.next(
              JSON.parse(event.data) as RealtimeEventModel
            );
          } catch {
            observer.error(
              new RealtimeStreamError(
                'Realtime event could not be parsed.'
              )
            );
            closeSource();
          }
        };

        openSource();

        return () => {
          closeSource();
        };
      }
    );
  }

  private scheduleReconnect(
    reconnect: () => void
  ): void {

    if (this.reconnectTimer || this.explicitlyClosed) {
      return;
    }

    this.reconnectTimer =
      setTimeout(() => {
        this.reconnectTimer = null;
        reconnect();
      }, RealtimeEventSourceService.reconnectDelayMs);
  }

  private clearReconnectTimer(): void {

    if (!this.reconnectTimer) {
      return;
    }

    clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
  }

  private eventTypes(): RealtimeEventType[] {

    return [
      'CONNECTED',
      'LOG_INGESTED',
      'ANALYSIS_STARTED',
      'ANALYSIS_COMPLETED',
      'INCIDENT_STATUS_CHANGED'
    ];
  }
}
