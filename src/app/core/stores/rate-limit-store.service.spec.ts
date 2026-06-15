import {
  fakeAsync,
  TestBed,
  tick
} from '@angular/core/testing';

import {
  of,
  Subject
} from 'rxjs';

import { RateLimitStoreService } from './rate-limit-store.service';
import { RateLimitApiService } from '../api/rate-limit-api.service';

describe('RateLimitStoreService', () => {
  let service: RateLimitStoreService;
  let api: jasmine.SpyObj<RateLimitApiService>;

  beforeEach(() => {
    api = jasmine.createSpyObj<RateLimitApiService>(
      'RateLimitApiService',
      ['getStatus']
    );

    TestBed.configureTestingModule({
      providers: [
        RateLimitStoreService,
        {
          provide: RateLimitApiService,
          useValue: api
        }
      ]
    });

    service = TestBed.inject(RateLimitStoreService);
  });

  afterEach(() => {
    service.stopPolling();
    service.stopCountdowns();
  });

  it('uses local minute and daily countdowns from backend seconds', fakeAsync(() => {
    api.getStatus.and.returnValue(
      of({
        userId: 1,
        minuteUsage: 3,
        minuteLimit: 5,
        dailyUsage: 12,
        dailyLimit: 100,
        minuteResetInSeconds: 45,
        dailyResetInSeconds: 9127,
        blocked: false
      })
    );

    service.refreshNow();

    expect(service.minuteResetLabel()).toBe('45s');
    expect(service.dailyResetLabel()).toBe('02H 32M 07s');
    expect(service.dailyUsageLabel()).toBe('12/100');
    expect(api.getStatus).toHaveBeenCalledTimes(1);

    tick(1000);

    expect(service.minuteResetLabel()).toBe('44s');
    expect(service.dailyResetLabel()).toBe('02H 32M 06s');
    expect(api.getStatus).toHaveBeenCalledTimes(1);

    service.stopCountdowns();
  }));

  it('falls back to formatted reset text when countdown seconds are missing', () => {
    api.getStatus.and.returnValue(
      of({
        userId: 1,
        minuteUsage: 0,
        minuteLimit: 5,
        dailyUsage: 12,
        dailyLimit: 100,
        resetInSeconds: 0,
        minuteResetTimeFormatted: '0s',
        dailyResetTimeFormatted: 'Tomorrow 12:00 AM',
        blocked: false
      })
    );

    service.refreshNow();

    expect(service.minuteResetLabel()).toBe('0s');
    expect(service.dailyResetLabel()).toBe('Tomorrow 12:00 AM');
    expect(service.dailyUsageLabel()).toBe('12/100');
  });

  it('preserves the backend long-format minute timer style', fakeAsync(() => {
    api.getStatus.and.returnValue(
      of({
        userId: 1,
        minuteUsage: 1,
        minuteLimit: 5,
        dailyUsage: 12,
        dailyLimit: 100,
        minuteResetInSeconds: 30,
        minuteResetTimeFormatted: '00H 00M 30s',
        dailyResetInSeconds: 3600,
        dailyResetTimeFormatted: '01H 00M 00s',
        blocked: false
      })
    );

    service.refreshNow();

    expect(service.minuteResetLabel())
      .toBe('00H 00M 30s');
    expect(service.dailyResetLabel())
      .toBe('01H 00M 00s');

    tick(1000);

    expect(service.minuteResetLabel())
      .toBe('00H 00M 29s');
    expect(service.dailyResetLabel())
      .toBe('00H 59M 59s');

    service.stopCountdowns();
  }));

  it('refreshes and clears minute usage when the minute countdown expires', fakeAsync(() => {
    api.getStatus.and.returnValues(
      of({
        userId: 1,
        minuteUsage: 5,
        minuteLimit: 5,
        dailyUsage: 12,
        dailyLimit: 100,
        minuteResetInSeconds: 1,
        dailyResetInSeconds: 9127,
        blocked: true
      }),
      of({
        userId: 1,
        minuteUsage: 0,
        minuteLimit: 5,
        dailyUsage: 12,
        dailyLimit: 100,
        minuteResetInSeconds: 0,
        dailyResetInSeconds: 9126,
        blocked: false
      })
    );

    service.refreshNow();

    expect(service.minuteResetLabel()).toBe('1s');
    expect(service.minutePercent()).toBe(100);

    tick(1000);

    expect(service.minuteResetLabel()).toBe('0s');
    expect(service.status()?.minuteUsage).toBe(0);
    expect(service.minutePercent()).toBe(0);
    expect(service.status()?.blocked).toBeFalse();
    expect(api.getStatus).toHaveBeenCalledTimes(2);

    service.stopCountdowns();
  }));

  it('refreshes at daily expiry without locally resetting daily usage', fakeAsync(() => {
    const midnightRefresh =
      new Subject<{
        userId: number;
        minuteUsage: number;
        minuteLimit: number;
        dailyUsage: number;
        dailyLimit: number;
        minuteResetInSeconds: number;
        dailyResetInSeconds: number;
        blocked: boolean;
      }>();

    api.getStatus.and.returnValues(
      of({
        userId: 1,
        minuteUsage: 0,
        minuteLimit: 5,
        dailyUsage: 99,
        dailyLimit: 100,
        minuteResetInSeconds: 30,
        dailyResetInSeconds: 1,
        blocked: false
      }),
      midnightRefresh
    );

    service.refreshNow();
    tick(1000);

    expect(service.dailyResetLabel()).toBe('00H 00M 00s');
    expect(service.status()?.dailyUsage).toBe(99);
    expect(api.getStatus).toHaveBeenCalledTimes(2);

    midnightRefresh.next({
      userId: 1,
      minuteUsage: 0,
      minuteLimit: 5,
      dailyUsage: 0,
      dailyLimit: 100,
      minuteResetInSeconds: 29,
      dailyResetInSeconds: 86400,
      blocked: false
    });
    midnightRefresh.complete();

    expect(service.status()?.dailyUsage).toBe(0);
    expect(service.dailyCountdownSeconds()).toBe(86400);

    service.stopCountdowns();
  }));
});
