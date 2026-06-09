import {
  Injectable,
  inject
} from '@angular/core';

import {
  Observable
} from 'rxjs';

import { environment } from '../../../environments/environment';

import { AuthStoreService } from '../stores/auth-store.service';

export interface ChatStreamChunk {
  content: string;
  completed: boolean;
}

const MAX_TRANSIENT_ERRORS = 2;

export class ChatStreamError extends Error {

  constructor(
    message: string,
    readonly status?: number
  ) {
    super(message);
    this.name = 'ChatStreamError';
  }
}

@Injectable({
  providedIn: 'root'
})
export class ChatStreamingService {

  private readonly authStore =
    inject(AuthStoreService);

  private readonly activeSources =
    new Set<EventSource>();

  closeAll(): void {

    this.activeSources.forEach(source =>
      source.close()
    );

    this.activeSources.clear();
  }

  stream(
    uploadId: string,
    message: string
  ): Observable<ChatStreamChunk> {

    return new Observable<ChatStreamChunk>(
      observer => {

        const token =
          this.authStore.getToken();

        if (!token) {
          observer.error(
            new ChatStreamError(
              'Your session expired. Please log in again.',
              401
            )
          );
          return undefined;
        }

        const params =
          new URLSearchParams({
            uploadId,
            message,
            token
          });

        const source =
          new EventSource(
            `${environment.apiBaseUrl}/chat/stream?${params.toString()}`
          );

        this.activeSources.add(source);

        let transientErrors = 0;
        let closedSuccessfully = false;

        const closeSource = (): void => {

          this.activeSources.delete(source);
          source.close();
        };

        const closeSuccessfully = (
          chunk: ChatStreamChunk = {
            content: '',
            completed: true
          }
        ): void => {

          if (closedSuccessfully) {
            return;
          }

          closedSuccessfully = true;

          observer.next(chunk);
          closeSource();
          observer.complete();
        };

        const parseChunk = (
          data: string
        ): ChatStreamChunk => {

          if (!data) {
            return {
              content: '',
              completed: true
            };
          }

          return JSON.parse(data) as ChatStreamChunk;
        };

        source.onmessage = event => {

          if (closedSuccessfully) {
            return;
          }

          try {
            transientErrors = 0;

            const chunk =
              parseChunk(event.data);

            if (chunk.completed) {
              closeSuccessfully(chunk);
              return;
            }

            observer.next(chunk);
          } catch (error) {
            closedSuccessfully = true;
            closeSource();
            observer.error(error);
          }
        };

        source.addEventListener(
          'complete',
          event => {

            if (closedSuccessfully) {
              return;
            }

            try {
              const messageEvent =
                event as MessageEvent<string>;

              const chunk =
                parseChunk(messageEvent.data);

              closeSuccessfully({
                ...chunk,
                completed: true
              });
            } catch (error) {
              closedSuccessfully = true;
              closeSource();
              observer.error(error);
            }
          }
        );

        source.onerror = () => {

          if (closedSuccessfully) {
            closeSource();
            return;
          }

          transientErrors += 1;

          if (
            source.readyState === EventSource.CONNECTING &&
            transientErrors <= MAX_TRANSIENT_ERRORS
          ) {
            return;
          }

          closedSuccessfully = true;

          closeSource();

          observer.error(
            new ChatStreamError(
              'Streaming chat failed. Please try again.'
            )
          );
        };

        return () => {
          closedSuccessfully = true;
          closeSource();
        };
      }
    );
  }
}
