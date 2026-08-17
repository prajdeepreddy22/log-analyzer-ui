import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { AuthStoreService } from '../stores/auth-store.service';
import { RealtimeEventSourceService } from './realtime-event-source.service';

class FakeEventSource {
  static lastInstance: FakeEventSource | null = null;

  readonly listeners = new Map<string, (event: MessageEvent<string>) => void>();
  readyState = 1;
  closed = false;
  onerror: ((event: Event) => void) | null = null;

  constructor(readonly url: string) {
    FakeEventSource.lastInstance = this;
  }

  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject
  ): void {
    this.listeners.set(
      type,
      listener as (event: MessageEvent<string>) => void
    );
  }

  close(): void {
    this.closed = true;
    this.readyState = EventSource.CLOSED;
  }

  emit(
    type: string,
    data: unknown
  ): void {
    this.listeners.get(type)?.({
      data: JSON.stringify(data)
    } as MessageEvent<string>);
  }
}

describe('RealtimeEventSourceService', () => {
  const originalEventSource = window.EventSource;
  let authStore: jasmine.SpyObj<AuthStoreService>;

  beforeEach(() => {
    FakeEventSource.lastInstance = null;
    (window as unknown as { EventSource: typeof EventSource }).EventSource =
      FakeEventSource as unknown as typeof EventSource;

    authStore = jasmine.createSpyObj<AuthStoreService>(
      'AuthStoreService',
      ['getToken']
    );

    TestBed.configureTestingModule({
      providers: [
        RealtimeEventSourceService,
        {
          provide: AuthStoreService,
          useValue: authStore
        }
      ]
    });
  });

  afterEach(() => {
    (window as unknown as { EventSource: typeof EventSource }).EventSource =
      originalEventSource;
  });

  it('connects to the realtime stream with a URL encoded JWT token', () => {
    authStore.getToken.and.returnValue('jwt token+value');

    const service = TestBed.inject(RealtimeEventSourceService);
    const events: unknown[] = [];

    const subscription = service.connect().subscribe(event => {
      events.push(event);
    });

    const source = FakeEventSource.lastInstance;

    expect(source?.url).toBe(
      `${environment.apiBaseUrl}/events/stream?token=jwt+token%2Bvalue`
    );

    source?.emit('CONNECTED', {
      type: 'CONNECTED',
      data: {
        message: 'Realtime stream connected'
      },
      timestamp: '2026-08-17T10:00:00'
    });

    expect(events.length).toBe(1);

    subscription.unsubscribe();
    expect(source?.closed).toBeTrue();
  });

  it('fails before opening EventSource when no valid token exists', done => {
    authStore.getToken.and.returnValue(null);

    const service = TestBed.inject(RealtimeEventSourceService);

    service.connect().subscribe({
      error: error => {
        expect(error.status).toBe(401);
        expect(FakeEventSource.lastInstance).toBeNull();
        done();
      }
    });
  });
});
