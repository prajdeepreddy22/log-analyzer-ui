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

  private readonly authStore =
    inject(AuthStoreService);

  private activeSource:
    EventSource | null = null;

  close(): void {

    this.activeSource?.close();
    this.activeSource = null;
  }

  connect(): Observable<RealtimeEventModel> {

    this.close();

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

        const params =
          new URLSearchParams({ token });

        const source =
          new EventSource(
            `${environment.apiBaseUrl}/events/stream?${params.toString()}`
          );

        this.activeSource = source;

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

        this.eventTypes().forEach(type => {
          source.addEventListener(
            type,
            event =>
              handleEvent(event as MessageEvent<string>)
          );
        });

        source.onerror = () => {

          if (source.readyState === EventSource.CLOSED) {
            closeSource();
            return;
          }

          observer.error(
            new RealtimeStreamError(
              'Realtime connection failed. It will reconnect when refreshed.'
            )
          );
          closeSource();
        };

        return () => {
          closeSource();
        };
      }
    );
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
