import {
  Injectable,
  computed,
  inject,
  signal
} from '@angular/core';

import {
  Subscription,
  finalize,
  interval,
  startWith,
  switchMap,
  take,
  takeWhile
} from 'rxjs';

import { AnalysisApiService } from '../api/analysis-api.service';
import { RateLimitStoreService } from './rate-limit-store.service';

import { AnalysisResponseModel } from '../models/analysis/analysis-response.model';
import {
  AnalysisStatus,
  AnalysisStatusResponseModel
} from '../models/analysis/analysis-status-response.model';
import { getApiErrorMessage } from '../utils/api-error-message.util';
import { HttpErrorResponse } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AnalysisStoreService {

  private readonly analysisApi =
    inject(AnalysisApiService);

  private readonly rateLimitStore =
    inject(RateLimitStoreService);

  private pollingSub:
    Subscription | null = null;

  private static readonly MAX_POLL_ATTEMPTS =
    120;

  // =========================
  // STATE
  // =========================

  readonly analysis =
    signal<AnalysisResponseModel | null>(null);

  readonly history =
    signal<AnalysisResponseModel[]>([]);

  readonly loading =
    signal(false);

  readonly status =
    signal<AnalysisStatus | null>(null);

  readonly statusMessage =
    signal<string | null>(null);

  readonly error =
    signal<string | null>(null);

  readonly historyLoading =
    signal(false);

  readonly hasAnalysis = computed(() =>
    Boolean(this.analysis())
  );

  readonly isProcessing = computed(() =>
    this.loading() ||
    this.isProgressStatus(this.status())
  );

  readonly isCompleted = computed(() =>
    this.status() === 'COMPLETED'
  );

  readonly isFailed = computed(() =>
    this.status() === 'FAILED'
  );

  // =========================
  // TRIGGER ANALYSIS
  // =========================

  triggerAnalysis(
    uploadId: string,
    force = false
  ): void {

    this.stopPolling();

    this.loading.set(true);

    this.error.set(null);

    this.analysis.set(null);

    this.statusMessage.set(
      'Submitting analysis request...'
    );

    this.analysisApi
      .triggerAnalysis(uploadId, force)
      .pipe(
        finalize(() => {
          this.loading.set(false);
          this.rateLimitStore.refreshNow();
        })
      )
      .subscribe({

        next: response => {

          const status =
            this.normalizeStatus(
              response,
              'QUEUED'
            );

          this.status.set(status);

          this.statusMessage.set(
            response?.message ||
            this.defaultStatusMessage(status)
          );

          if (status === 'COMPLETED') {
            this.loadAnalysis(uploadId);
            return;
          }

          if (status === 'FAILED') {
            this.error.set(
              this.analysisFailureMessage(response)
            );
            return;
          }

          if (status === 'NOT_STARTED') {
            this.analysis.set(null);
            return;
          }

          this.startPolling(uploadId);
        },

        error: err => {
          this.error.set(
            this.httpFailureMessage(
              err,
              'Failed to trigger analysis.'
            )
          );

          this.statusMessage.set(null);
        }
      });
  }

  // =========================
  // LOAD ANALYSIS
  // =========================

  loadAnalysis(
    uploadId: string
  ): void {

    this.loading.set(true);

    this.error.set(null);

    this.analysisApi
      .getAnalysis(uploadId)
      .pipe(
        finalize(() =>
          this.loading.set(false)
        )
      )
      .subscribe({

        next: response => {

          this.analysis.set(response);

          const status =
            this.normalizeStatus(
              response,
              'COMPLETED'
            );

          this.status.set(status);

          this.statusMessage.set(
            response.message ||
            this.defaultStatusMessage(status)
          );

          if (
            this.isProgressStatus(status)
          ) {

            this.analysis.set(null);

            this.startPolling(uploadId);
            return;
          }

          if (status === 'NOT_STARTED') {
            this.analysis.set(null);
          }
        },

        error: err => {
          if (err.status === 404) {

            this.analysis.set(null);
            this.status.set(null);
            this.statusMessage.set(null);
            this.error.set(
              this.resourceUnavailableMessage()
            );

            return;
          }

          this.error.set(
            this.httpFailureMessage(
              err,
              'Failed to load analysis.'
            )
          );

          this.statusMessage.set(null);
        }
      });
  }

  loadStatusThenAnalysis(
    uploadId: string
  ): void {

    this.stopPolling();

    this.loading.set(true);

    this.error.set(null);

    this.analysis.set(null);

    this.statusMessage.set(
      'Checking analysis status...'
    );

    this.analysisApi
      .getStatus(uploadId)
      .pipe(
        finalize(() =>
          this.loading.set(false)
        )
      )
      .subscribe({

        next: response => {

          const status =
            this.normalizeStatus(
              response,
              'NOT_STARTED'
            );

          this.status.set(status);

          this.statusMessage.set(
            response.message ||
            this.defaultStatusMessage(status)
          );

          if (status === 'COMPLETED') {
            this.loadAnalysis(uploadId);
            return;
          }

          if (status === 'FAILED') {
            this.error.set(
              this.analysisFailureMessage(response)
            );
            return;
          }

          if (this.isProgressStatus(status)) {
            this.startPolling(uploadId);
          }
        },

        error: err => {
          if (err.status === 404) {
            this.stopPolling();
            this.status.set(null);
            this.statusMessage.set(null);
            this.error.set(
              this.resourceUnavailableMessage()
            );
            return;
          }

          this.error.set(
            this.httpFailureMessage(
              err,
              'Failed to load analysis status.'
            )
          );

          this.statusMessage.set(null);
        }
      });
  }

  loadHistory(): void {

    this.historyLoading.set(true);

    this.analysisApi
      .getHistory()
      .pipe(
        finalize(() =>
          this.historyLoading.set(false)
        )
      )
      .subscribe({

        next: history => {

          this.history.set(history);
        },

        error: err => {
          this.error.set(
            this.httpFailureMessage(
              err,
              'Failed to load analysis history.'
            )
          );
        }
      });
  }

  // =========================
  // POLLING
  // =========================

  pollStatus(
    uploadId: string
  ): void {

    this.startPolling(uploadId);
  }

  startPolling(
    uploadId: string
  ): void {

    if (this.pollingSub) {
      return;
    }

    this.loading.set(false);

    this.pollingSub =
      interval(2500)
      .pipe(
        startWith(0),

        switchMap(() =>
          this.analysisApi.getStatus(
            uploadId
          )
        ),

        takeWhile(
          response => {

            const status =
              this.normalizeStatus(response);

            return (
              status !== 'COMPLETED' &&
              status !== 'FAILED' &&
              status !== 'NOT_STARTED'
            );
          },
          true
        ),

        take(
          AnalysisStoreService.MAX_POLL_ATTEMPTS
        )
      )
      .subscribe({

        next: response => {

          const status =
            this.normalizeStatus(response);

          this.status.set(status);

          this.statusMessage.set(
            response.message ||
            this.defaultStatusMessage(status)
          );

          if (
            status ===
            'COMPLETED'
          ) {

            this.stopPolling();

            this.loadAnalysis(
              uploadId
            );
          }

          if (
            status ===
            'FAILED'
          ) {

            this.stopPolling();

            this.error.set(
              this.analysisFailureMessage(response)
            );
          }

          if (
            status ===
            'NOT_STARTED'
          ) {
            this.stopPolling();
            this.statusMessage.set(
              this.defaultStatusMessage(status)
            );
          }
        },

        error: err => {
          this.stopPolling();

          if (
            err instanceof HttpErrorResponse &&
            err.status === 404
          ) {
            this.status.set(null);
            this.statusMessage.set(null);
            this.error.set(
              this.resourceUnavailableMessage()
            );
            return;
          }

          this.error.set(
            this.httpFailureMessage(
              err,
              'Analysis status polling failed.'
            )
          );

          this.statusMessage.set(null);
        },

        complete: () => {
          this.pollingSub = null;

          if (this.isProgressStatus(this.status())) {
            this.statusMessage.set(null);
            this.error.set(
              'Analysis is taking longer than expected. Refresh the status or try again later.'
            );
          }
        }
      });
  }

  stopPolling(): void {

    this.pollingSub?.unsubscribe();

    this.pollingSub = null;
  }

  reset(): void {

    this.stopPolling();
    this.analysis.set(null);
    this.history.set([]);
    this.loading.set(false);
    this.status.set(null);
    this.statusMessage.set(null);
    this.error.set(null);
    this.historyLoading.set(false);
  }

  private normalizeStatus(
    response:
      | AnalysisResponseModel
      | AnalysisStatusResponseModel
      | null
      | undefined,
    fallback: AnalysisStatus = 'PROCESSING'
  ): AnalysisStatus {

    const status = (
      response?.status ||
      response?.analysis_status ||
      response?.analysisStatus ||
      fallback
    ).toUpperCase();

    if (status === 'CACHED') {
      return 'COMPLETED';
    }

    if (status === 'RETRY') {
      return 'RETRYING';
    }

    return status as AnalysisStatus;
  }

  private analysisFailureMessage(
    response:
      | AnalysisResponseModel
      | AnalysisStatusResponseModel
      | null
      | undefined
  ): string {

    return (
      response?.errorMessage ||
      response?.error_message ||
      response?.message ||
      'Analysis failed. Retry the analysis or inspect the backend AI provider logs for the failure reason.'
    );
  }

  private httpFailureMessage(
    error: unknown,
    fallback: string
  ): string {

    if (error instanceof HttpErrorResponse) {
      return getApiErrorMessage(error);
    }

    return fallback;
  }

  private resourceUnavailableMessage(): string {

    return 'The requested upload is unavailable.';
  }

  private isProgressStatus(
    status: AnalysisStatus | null
  ): boolean {

    return (
      status === 'PENDING' ||
      status === 'QUEUED' ||
      status === 'PROCESSING' ||
      status === 'RETRYING'
    );
  }

  private defaultStatusMessage(
    status: AnalysisStatus | null
  ): string {

    switch (status) {

      case 'NOT_STARTED':
        return 'No analysis has been started for this upload yet.';

      case 'PENDING':
      case 'QUEUED':
        return 'Analysis request is queued.';

      case 'PROCESSING':
        return 'AI analysis is running.';

      case 'RETRYING':
        return 'Analysis is retrying after a failed attempt.';

      case 'COMPLETED':
        return 'Analysis completed.';

      case 'FAILED':
        return 'Analysis failed.';

      default:
        return 'Waiting for analysis status...';
    }
  }
}
