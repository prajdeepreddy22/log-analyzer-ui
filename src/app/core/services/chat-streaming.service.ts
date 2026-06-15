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

    this.closeAll();

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
            message,
            uploadId,
            token
          });

        const source =
          new EventSource(
            `${environment.apiBaseUrl}/chat/stream?${params.toString()}`
          );

        this.activeSources.add(source);

        let closedSuccessfully = false;
        let sourceClosed = false;

        const closeSource = (): void => {

          if (sourceClosed) {
            return;
          }

          sourceClosed = true;
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
            observer.error(
              new ChatStreamError(
                'The streaming response could not be read.'
              )
            );
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
              observer.error(
                new ChatStreamError(
                  'The streaming response could not be read.'
                )
              );
            }
          }
        );

        source.onerror = event => {

          if (closedSuccessfully) {
            closeSource();
            return;
          }

          const data =
            (event as MessageEvent<string>)
              .data;

          if (typeof data === 'string' && data) {
            try {
              const chunk =
                parseChunk(data);

              closedSuccessfully = true;
              closeSource();

              observer.error(
                new ChatStreamError(
                  chunk.content ||
                  'Streaming chat failed. Please try again.'
                )
              );
              return;
            } catch {
              // Fall through to the generic transport error.
            }
          }

          if (
            source.readyState ===
            EventSource.CLOSED
          ) {
            closeSuccessfully();
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
