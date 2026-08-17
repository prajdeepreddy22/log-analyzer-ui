import {
  Injectable,
  computed,
  inject,
  signal
} from '@angular/core';

import {
  finalize
} from 'rxjs/operators';

import { HttpErrorResponse } from '@angular/common/http';
import { LogSourceApiService } from '../api/log-source-api.service';
import {
  LogSourceModel,
  LogSourceStatus,
  LogSourceType
} from '../models/settings/log-source.model';
import { getApiErrorMessage } from '../utils/api-error-message.util';

@Injectable({
  providedIn: 'root'
})
export class LogSourceStoreService {

  private readonly logSourceApi =
    inject(LogSourceApiService);

  readonly sources =
    signal<LogSourceModel[]>([]);

  readonly loading =
    signal(false);

  readonly creating =
    signal(false);

  readonly updatingId =
    signal<number | null>(null);

  readonly error =
    signal<string | null>(null);

  readonly success =
    signal<string | null>(null);

  readonly activeSources = computed(() =>
    this.sources().filter(source =>
      source.status === 'ACTIVE'
    )
  );

  readonly inactiveSources = computed(() =>
    this.sources().filter(source =>
      source.status === 'INACTIVE'
    )
  );

  readonly hasSources = computed(() =>
    this.sources().length > 0
  );

  loadSources(): void {

    this.loading.set(true);
    this.error.set(null);

    this.logSourceApi
      .getSources()
      .pipe(
        finalize(() =>
          this.loading.set(false)
        )
      )
      .subscribe({

        next: sources => {
          this.sources.set(sources);
        },

        error: error => {
          this.error.set(
            this.errorMessage(
              error,
              'Failed to load log sources.'
            )
          );
        }
      });
  }

  createSource(
    sourceName: string,
    sourceType: LogSourceType
  ): void {

    const normalizedName =
      sourceName.trim();

    this.creating.set(true);
    this.error.set(null);
    this.success.set(null);

    this.logSourceApi
      .createSource({
        sourceName: normalizedName,
        sourceType
      })
      .pipe(
        finalize(() =>
          this.creating.set(false)
        )
      )
      .subscribe({

        next: source => {
          this.sources.update(sources => [
            source,
            ...sources
          ]);

          this.success.set(
            'Log source created successfully.'
          );
        },

        error: error => {
          this.error.set(
            this.errorMessage(
              error,
              'Failed to create log source.'
            )
          );
        }
      });
  }

  updateStatus(
    source: LogSourceModel,
    status: LogSourceStatus
  ): void {

    if (source.status === status) {
      return;
    }

    this.updatingId.set(source.id);
    this.error.set(null);
    this.success.set(null);

    this.logSourceApi
      .updateStatus(source.id, status)
      .pipe(
        finalize(() =>
          this.updatingId.set(null)
        )
      )
      .subscribe({

        next: updatedSource => {
          this.sources.update(sources =>
            sources.map(item =>
              item.id === updatedSource.id
                ? updatedSource
                : item
            )
          );

          this.success.set(
            status === 'ACTIVE'
              ? 'Log source activated.'
              : 'Log source deactivated.'
          );
        },

        error: error => {
          this.error.set(
            this.errorMessage(
              error,
              'Failed to update log source.'
            )
          );
        }
      });
  }

  clearMessages(): void {

    this.error.set(null);
    this.success.set(null);
  }

  reset(): void {

    this.sources.set([]);
    this.loading.set(false);
    this.creating.set(false);
    this.updatingId.set(null);
    this.error.set(null);
    this.success.set(null);
  }

  private errorMessage(
    error: unknown,
    fallback: string
  ): string {

    return error instanceof HttpErrorResponse
      ? getApiErrorMessage(error)
      : fallback;
  }
}
