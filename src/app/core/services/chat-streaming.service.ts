import {
  Injectable,
  inject
} from '@angular/core';

import {
  Observable
} from 'rxjs';

import { environment } from '../../../environments/environment';

import { AuthService } from './auth.service';

export interface ChatStreamChunk {
  content: string;
  completed: boolean;
}

const MAX_TRANSIENT_ERRORS = 2;

@Injectable({
  providedIn: 'root'
})
export class ChatStreamingService {

  private readonly authService =
    inject(AuthService);

  stream(
    uploadId: string,
    message: string
  ): Observable<ChatStreamChunk> {

    return new Observable<ChatStreamChunk>(
      observer => {

        const token =
          this.authService.getToken();

        if (!token) {
          observer.error(
            new Error('Missing authentication token')
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

        let transientErrors = 0;
        let closedSuccessfully = false;

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
          source.close();
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

        source.onopen = () => {
          transientErrors = 0;
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
            observer.error(error);
            source.close();
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
              observer.error(error);
              source.close();
            }
          }
        );

        source.onerror = () => {

          if (closedSuccessfully) {
            source.close();
            return;
          }

          transientErrors += 1;

          if (
            source.readyState === EventSource.CONNECTING &&
            transientErrors <= MAX_TRANSIENT_ERRORS
          ) {
            return;
          }

          observer.error(
            new Error('Chat stream failed')
          );
          source.close();
        };

        return () => {
          closedSuccessfully = true;
          source.close();
        };
      }
    );
  }
}
