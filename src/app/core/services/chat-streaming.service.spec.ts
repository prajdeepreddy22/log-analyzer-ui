import { TestBed } from '@angular/core/testing';

import {
  ChatStreamingService
} from './chat-streaming.service';
import { AuthStoreService } from '../stores/auth-store.service';
import { environment } from '../../../environments/environment';

class MockEventSource {
  static instances: MockEventSource[] = [];

  readonly url: string;
  readyState: number = EventSource.OPEN;
  onopen: (() => void) | null = null;
  onmessage: ((event: MessageEvent<string>) => void) | null = null;
  onerror: (() => void) | null = null;
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
      `${environment.apiBaseUrl}/chat/stream?uploadId=upload-1&message=Why+did+it+fail%3F&token=jwt-token`
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

    source.onerror?.();
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

  it('stops reconnecting after the configured transient error limit', done => {
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

    source.onerror?.();
    source.onerror?.();
    source.onerror?.();
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
