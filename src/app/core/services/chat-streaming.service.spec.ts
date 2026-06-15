import { TestBed } from '@angular/core/testing';

import {
  ChatStreamingService,
  ChatStreamChunk
} from './chat-streaming.service';
import { AuthStoreService } from '../stores/auth-store.service';
import { environment } from '../../../environments/environment';

class MockEventSource {
  static instances: MockEventSource[] = [];
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSED = 2;

  readonly url: string;
  readyState: number = EventSource.OPEN;
  onopen: (() => void) | null = null;
  onmessage: ((event: MessageEvent<string>) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  close = jasmine.createSpy('close');
  listeners = new Map<string, Array<(event: Event) => void>>();

  constructor(url: string) {
    this.url = url;
    MockEventSource.instances.push(this);
  }

  addEventListener(
    type: string,
    listener: (event: Event) => void
  ): void {

    const listeners =
      this.listeners.get(type) || [];

    listeners.push(listener);

    this.listeners.set(
      type,
      listeners
    );
  }

  emit(
    type: string,
    data: string
  ): void {

    const event =
      {
        data
      } as MessageEvent<string>;

    this.listeners
      .get(type)
      ?.forEach(listener =>
        listener(event)
      );
  }
}

describe('ChatStreamingService', () => {
  let service: ChatStreamingService;
  let authStore: jasmine.SpyObj<AuthStoreService>;
  let originalEventSource: typeof EventSource;

  beforeEach(() => {
    MockEventSource.instances = [];

    originalEventSource = window.EventSource;

    authStore = jasmine.createSpyObj<AuthStoreService>(
      'AuthStoreService',
      ['getToken']
    );

    TestBed.configureTestingModule({
      providers: [
        ChatStreamingService,
        {
          provide: AuthStoreService,
          useValue: authStore
        }
      ]
    });

    Object.defineProperty(window, 'EventSource', {
      configurable: true,
      value: MockEventSource
    });

    service = TestBed.inject(ChatStreamingService);
  });

  afterEach(() => {
    Object.defineProperty(window, 'EventSource', {
      configurable: true,
      value: originalEventSource
    });
  });

  it('opens SSE with upload, message, and token query params', () => {
    authStore.getToken.and.returnValue('jwt-token');

    const subscription =
      service
        .stream('upload-1', 'Why did it fail?')
        .subscribe();

    const source =
      MockEventSource.instances[0];

    expect(source.url).toBe(
      `${environment.apiBaseUrl}/chat/stream?message=Why+did+it+fail%3F&uploadId=upload-1&token=jwt-token`
    );

    subscription.unsubscribe();

    expect(source.close).toHaveBeenCalled();
  });

  it('emits chunks and closes when stream completes', done => {
    authStore.getToken.and.returnValue('jwt-token');

    const chunks: string[] = [];

    service
      .stream('upload-1', 'question')
      .subscribe({
        next: chunk => {
          chunks.push(chunk.content);
        },
        complete: () => {
          const source =
            MockEventSource.instances[0];

          expect(chunks).toEqual([
            'partial',
            ''
          ]);

          expect(source.close).toHaveBeenCalled();
          done();
        }
      });

    const source =
      MockEventSource.instances[0];

    source.onmessage?.({
      data: JSON.stringify({
        content: 'partial',
        completed: false
      })
    } as MessageEvent<string>);

    source.onmessage?.({
      data: JSON.stringify({
        content: '',
        completed: true
      })
    } as MessageEvent<string>);
  });

  it('handles backend complete event without reporting interruption', done => {
    authStore.getToken.and.returnValue('jwt-token');

    const chunks: string[] = [];

    service
      .stream('upload-1', 'question')
      .subscribe({
        next: chunk => {
          chunks.push(chunk.content);
        },
        error: () => {
          fail('successful complete event should not error');
        },
        complete: () => {
          const source =
            MockEventSource.instances[0];

          expect(chunks).toEqual([
            'partial',
            ''
          ]);

          expect(source.close).toHaveBeenCalled();
          done();
        }
      });

    const source =
      MockEventSource.instances[0];

    source.onmessage?.({
      data: JSON.stringify({
        content: 'partial',
        completed: false
      })
    } as MessageEvent<string>);

    source.emit(
      'complete',
      JSON.stringify({
        content: '',
        completed: true
      })
    );

    source.onerror?.(new Event('error'));
  });

  it('fails before opening SSE when token is missing', done => {
    authStore.getToken.and.returnValue(null);

    service
      .stream('upload-1', 'question')
      .subscribe({
        error: error => {
          expect(error.message).toContain(
            'session expired'
          );

          expect(MockEventSource.instances.length).toBe(0);
          done();
        }
      });
  });

  it('closes on the first transport error to prevent reconnect loops', done => {
    authStore.getToken.and.returnValue('jwt-token');

    service
      .stream('upload-1', 'question')
      .subscribe({
        error: error => {
          const source =
            MockEventSource.instances[0];

          expect(error.message).toContain(
            'Streaming chat failed'
          );

          expect(source.close).toHaveBeenCalled();
          done();
        }
      });

    const source =
      MockEventSource.instances[0];

    source.readyState =
      EventSource.CONNECTING;

    source.onerror?.(new Event('error'));
  });

  it('closes a 204-style terminal EventSource without reconnecting', done => {
    authStore.getToken.and.returnValue('jwt-token');

    const chunks: ChatStreamChunk[] = [];

    service
      .stream('upload-1', 'question')
      .subscribe({
        next: chunk => {
          chunks.push(chunk);
        },
        error: () => {
          fail('HTTP 204 duplicate reconnect should complete');
        },
        complete: () => {
          const source =
            MockEventSource.instances[0];

          expect(source.readyState)
            .toBe(EventSource.CLOSED);
          expect(source.close)
            .toHaveBeenCalledTimes(1);
          expect(MockEventSource.instances.length)
            .toBe(1);
          expect(chunks).toEqual([
            {
              content: '',
              completed: true
            }
          ]);
          done();
        }
      });

    const source =
      MockEventSource.instances[0];

    source.readyState =
      EventSource.CLOSED;

    source.onerror?.(new Event('error'));
  });

  it('closes an existing stream before opening another one', () => {
    authStore.getToken.and.returnValue('jwt-token');

    const first =
      service.stream('upload-1', 'first').subscribe();

    const firstSource =
      MockEventSource.instances[0];

    const second =
      service.stream('upload-1', 'second').subscribe();

    expect(firstSource.close)
      .toHaveBeenCalled();
    expect(MockEventSource.instances.length)
      .toBe(2);

    first.unsubscribe();
    second.unsubscribe();
  });

  it('surfaces the backend named error event and closes the stream', done => {
    authStore.getToken.and.returnValue('jwt-token');

    service
      .stream('upload-1', 'question')
      .subscribe({
        error: error => {
          const source =
            MockEventSource.instances[0];

          expect(error.message).toBe(
            'AI provider timed out'
          );

          expect(source.close)
            .toHaveBeenCalled();

          done();
        }
      });

    const source =
      MockEventSource.instances[0];

    source.onerror?.({
      data: JSON.stringify({
        content: 'AI provider timed out',
        completed: true
      })
    } as MessageEvent<string>);
  });

  it('closes all active streams during session cleanup', () => {
    authStore.getToken.and.returnValue('jwt-token');

    service
      .stream('upload-1', 'question')
      .subscribe();

    service
      .stream('upload-2', 'question')
      .subscribe();

    service.closeAll();

    expect(
      MockEventSource.instances[0].close
    ).toHaveBeenCalled();

    expect(
      MockEventSource.instances[1].close
    ).toHaveBeenCalled();
  });
});
