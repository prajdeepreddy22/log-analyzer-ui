import {
  Injectable,
  computed,
  inject,
  signal
} from '@angular/core';

import {
  EMPTY,
  Subscription,
  interval
} from 'rxjs';

import {
  catchError,
  finalize,
  startWith,
  switchMap
} from 'rxjs/operators';

import { RateLimitApiService } from '../api/rate-limit-api.service';
import { RateLimitStatusModel } from '../models/rate-limit/rate-limit-status.model';

@Injectable({
  providedIn: 'root'
})
export class RateLimitStoreService {

  private readonly rateLimitApi =
    inject(RateLimitApiService);

  private pollingSub:
    Subscription | null = null;

  private dailyCountdownTimer:
    ReturnType<typeof setInterval> | null = null;

  private minuteCountdownTimer:
    ReturnType<typeof setInterval> | null = null;

  private minuteExpiryRefreshQueued =
    false;

  private dailyExpiryRefreshQueued =
    false;

  readonly status =
    signal<RateLimitStatusModel | null>(null);

  readonly minuteCountdownSeconds =
    signal<number | null>(null);

  readonly dailyCountdownSeconds =
    signal<number | null>(null);

  private minuteLongFormat =
    false;

  readonly loading =
    signal(false);

  readonly refreshing =
    signal(false);

  readonly unavailable =
    signal(false);

  readonly minutePercent = computed(() =>
    this.percent(
      this.status()?.minuteUsage,
      this.status()?.minuteLimit
    )
  );

  readonly dailyPercent = computed(() =>
    this.percent(
      this.status()?.dailyUsage,
      this.status()?.dailyLimit
    )
  );

  readonly minuteWarning = computed(() =>
    this.minutePercent() >= 80 &&
    !this.status()?.blocked
  );

  readonly dailyWarning = computed(() =>
    this.dailyPercent() >= 80 &&
    !this.status()?.blocked
  );

  readonly quotaStateLabel = computed(() => {

    if (this.status()?.blocked) {
      return 'BLOCKED';
    }

    if (
      this.minuteWarning() ||
      this.dailyWarning()
    ) {
      return 'NEAR LIMIT';
    }

    return 'AVAILABLE';
  });

  readonly minuteResetLabel = computed(() =>
  {

    const seconds =
      this.minuteCountdownSeconds();

    if (seconds !== null) {
      return this.formatMinuteCountdown(seconds);
    }

    if (
      this.status()?.resetInSeconds !== undefined &&
      this.status()?.resetInSeconds !== null
    ) {
      return this.formatMinuteCountdown(
        this.status()?.resetInSeconds ?? 0
      );
    }

    return this.status()?.minuteResetTimeFormatted ??
      '0s';
  });

  readonly dailyResetLabel = computed(() => {

    const seconds =
      this.dailyCountdownSeconds();

    if (seconds !== null) {
      return this.formatCountdown(seconds);
    }

    return this.status()?.dailyResetTimeFormatted ??
      'Resets server-side daily';
  });

  readonly dailyUsageLabel = computed(() =>
    `${this.status()?.dailyUsage ?? 0}/${this.status()?.dailyLimit ?? 0}`
  );

  readonly remainingMinute = computed(() =>
    Math.max(
      0,
      (this.status()?.minuteLimit ?? 0)
        - (this.status()?.minuteUsage ?? 0)
    )
  );

  readonly remainingDaily = computed(() =>
    Math.max(
      0,
      (this.status()?.dailyLimit ?? 0)
        - (this.status()?.dailyUsage ?? 0)
    )
  );

  startPolling(): void {

    if (this.pollingSub) {
      return;
    }

    this.loading.set(true);

    this.pollingSub =
      interval(30000)
        .pipe(
          startWith(0),
          switchMap(() => {

            this.refreshing.set(true);

            return this.rateLimitApi
              .getStatus()
              .pipe(
                catchError(() => {

                  this.unavailable.set(true);
                  this.loading.set(false);
                  this.refreshing.set(false);

                  return EMPTY;
                })
              );
          })
        )
        .subscribe(status => {

          this.applyStatus(status);
          this.unavailable.set(false);
          this.loading.set(false);
          this.refreshing.set(false);
        });
  }

  stopPolling(): void {

    this.pollingSub?.unsubscribe();

    this.pollingSub = null;
  }

  stopDailyCountdown(): void {

    if (this.dailyCountdownTimer) {

      clearInterval(this.dailyCountdownTimer);

      this.dailyCountdownTimer = null;
    }
  }

  stopMinuteCountdown(): void {

    if (this.minuteCountdownTimer) {

      clearInterval(this.minuteCountdownTimer);

      this.minuteCountdownTimer = null;
    }
  }

  stopCountdowns(): void {

    this.stopMinuteCountdown();
    this.stopDailyCountdown();
  }

  reset(): void {

    this.stopCountdowns();
    this.status.set(null);
    this.minuteCountdownSeconds.set(null);
    this.dailyCountdownSeconds.set(null);
    this.loading.set(false);
    this.refreshing.set(false);
    this.unavailable.set(false);
    this.minuteExpiryRefreshQueued = false;
    this.dailyExpiryRefreshQueued = false;
    this.minuteLongFormat = false;
  }

  refreshNow(): void {

    this.minuteExpiryRefreshQueued = false;
    this.dailyExpiryRefreshQueued = false;

    this.refreshing.set(true);

    this.rateLimitApi
      .getStatus()
      .pipe(
        finalize(() =>
          this.refreshing.set(false)
        )
      )
      .subscribe({

        next: status => {

          this.applyStatus(status);
          this.unavailable.set(false);
          this.loading.set(false);
        },

        error: () => {

          this.unavailable.set(true);
          this.loading.set(false);
        }
      });
  }

  private applyStatus(
    status: RateLimitStatusModel
  ): void {

    this.status.set(status);

    this.minuteLongFormat =
      this.usesLongCountdownFormat(
        status.minuteResetTimeFormatted
      );

    this.startMinuteCountdown(
      status.minuteResetInSeconds
    );

    this.startDailyCountdown(
      status.dailyResetInSeconds
    );
  }

  private startMinuteCountdown(
    seconds: number | undefined
  ): void {

    this.stopMinuteCountdown();

    if (seconds === undefined || seconds === null) {

      this.minuteCountdownSeconds.set(null);

      return;
    }

    this.minuteCountdownSeconds.set(
      Math.max(0, seconds)
    );

    this.minuteExpiryRefreshQueued = false;

    this.minuteCountdownTimer =
      setInterval(() => {

        const current =
          this.minuteCountdownSeconds();

        if (current === null || current <= 0) {
          return;
        }

        const next =
          current - 1;

        this.minuteCountdownSeconds.set(next);

        if (next === 0) {
          this.stopMinuteCountdown();
          this.handleMinuteWindowExpired();
        }
      }, 1000);
  }

  private handleMinuteWindowExpired(): void {

    if (this.minuteExpiryRefreshQueued) {
      return;
    }

    this.minuteExpiryRefreshQueued = true;

    this.status.update(status => {

      if (!status) {
        return status;
      }

      const dailyLimitReached =
        status.dailyUsage >= status.dailyLimit;

      return {
        ...status,
        minuteUsage: 0,
        blocked: dailyLimitReached
      };
    });

    this.refreshNow();
  }

  private startDailyCountdown(
    seconds: number | undefined
  ): void {

    this.stopDailyCountdown();

    if (seconds === undefined || seconds === null) {

      this.dailyCountdownSeconds.set(null);

      return;
    }

    this.dailyCountdownSeconds.set(
      Math.max(0, seconds)
    );

    this.dailyExpiryRefreshQueued = false;

    this.dailyCountdownTimer =
      setInterval(() => {

        const current =
          this.dailyCountdownSeconds();

        if (current === null || current <= 0) {
          return;
        }

        const next =
          Math.max(0, current - 1);

        this.dailyCountdownSeconds.set(next);

        if (next === 0) {
          this.stopDailyCountdown();
          this.handleDailyWindowExpired();
        }
      }, 1000);
  }

  private handleDailyWindowExpired(): void {

    if (this.dailyExpiryRefreshQueued) {
      return;
    }

    this.dailyExpiryRefreshQueued = true;

    // Keep the displayed usage until the backend confirms midnight reset.
    this.refreshNow();
  }

  private percent(
    usage: number | undefined,
    limit: number | undefined
  ): number {

    if (!usage || !limit || limit <= 0) {
      return 0;
    }

    return Math.min(
      100,
      Math.round((usage / limit) * 100)
    );
  }

  private formatCountdown(
    seconds: number
  ): string {

    const safeSeconds =
      Math.max(0, seconds);

    const hours =
      Math.floor(safeSeconds / 3600);

    const minutes =
      Math.floor((safeSeconds % 3600) / 60);

    const remainingSeconds =
      safeSeconds % 60;

    return `${this.padTime(hours)}H ${this.padTime(minutes)}M ${this.padTime(remainingSeconds)}s`;
  }

  private formatMinuteCountdown(
    seconds: number
  ): string {

    return this.minuteLongFormat
      ? this.formatCountdown(seconds)
      : `${Math.max(0, seconds)}s`;
  }

  private usesLongCountdownFormat(
    value: string | undefined
  ): boolean {

    return Boolean(
      value &&
      /^\d{2}H \d{2}M \d{2}s$/i.test(
        value.trim()
      )
    );
  }

  private padTime(
    value: number
  ): string {

    return value
      .toString()
      .padStart(2, '0');
  }
}
