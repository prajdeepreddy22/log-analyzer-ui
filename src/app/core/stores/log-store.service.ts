import {
  Injectable,
  computed,
  inject,
  signal
} from '@angular/core';

import {
  finalize,
  Subscription
} from 'rxjs';

import { LogApiService } from '../api/log-api.service';

import { LogResponseModel } from '../models/log/log-response.model';

import { LogStatsResponseModel } from '../models/log/log-stats-response.model';

import { LogSearchRequestModel } from '../models/log/log-search-request.model';

import { LogLevel } from '../models/log/log-level.enum';

@Injectable({
  providedIn: 'root'
})
export class LogStoreService {

  private readonly logApi =
    inject(LogApiService);

  private activeLogsRequest:
    Subscription | null = null;

  private activeStatsRequest:
    Subscription | null = null;

  // =========================
  // STATE
  // =========================

  readonly logs =
    signal<LogResponseModel[]>([]);

  readonly selectedLog =
    signal<LogResponseModel | null>(null);

  readonly highlightedLogId =
    signal<number | null>(null);

  readonly stats =
    signal<LogStatsResponseModel | null>(null);

  readonly loading =
    signal(false);

  readonly statsLoading =
    signal(false);

  readonly error =
    signal<string | null>(null);

  // =========================
  // FILTERS
  // =========================

  readonly keyword =
    signal('');

  readonly level =
    signal<LogLevel | ''>('');

  readonly serviceName =
    signal('');

  // =========================
  // PAGINATION
  // =========================

  readonly page =
    signal(0);

  readonly size =
    signal(50);

  readonly totalPages =
    signal(0);

  readonly totalElements =
    signal(0);

  // =========================
  // SORTING
  // =========================

  readonly sortBy =
    signal('logTimestamp');

  readonly direction =
    signal<'asc' | 'desc'>('desc');

  // =========================
  // COMPUTED
  // =========================

  readonly hasLogs = computed(() =>
    this.logs().length > 0
  );

  readonly selectedLogId = computed(() =>
    this.selectedLog()?.id
  );

  readonly hasActiveFilters = computed(() =>
    Boolean(
      this.keyword() ||
      this.level() ||
      this.serviceName()
    )
  );

  // =========================
  // LOAD LOGS
  // =========================

  loadLogs(
    uploadId: string
  ): void {

    this.cancelLogsRequest();

    this.loading.set(true);

    this.error.set(null);

    let request:
      Subscription;

    request = this.logApi
      .getLogs(
        uploadId,
        this.page(),
        this.size(),
        this.sortBy(),
        this.direction()
      )
      .pipe(
        finalize(() => {

          if (this.activeLogsRequest === request) {
            this.loading.set(false);
            this.activeLogsRequest = null;
          }
        })
      )
      .subscribe({

        next: response => {

          this.page.set(response.page);

          this.size.set(response.size);

          this.logs.set(
            response.content
          );

          this.totalPages.set(
            response.totalPages
          );

          this.totalElements.set(
            response.totalElements
          );
        },

        error: err => {

          console.error(err);

          this.error.set(
            'Failed to load logs'
          );
        }
      });

    this.activeLogsRequest = request;
  }

  // =========================
  // SEARCH LOGS
  // =========================

  searchLogs(
    uploadId: string
  ): void {

    this.cancelLogsRequest();

    this.loading.set(true);

    this.error.set(null);

    const searchRequest:
      LogSearchRequestModel = {

      keyword:
        this.keyword(),

      level:
        this.level() || undefined,

      serviceName:
        this.serviceName() || undefined,

      page:
        this.page(),

      size:
        this.size(),

      sortBy:
        this.sortBy(),

      direction:
        this.direction()
    };

    let subscription:
      Subscription;

    subscription = this.logApi
      .searchLogs(
        uploadId,
        searchRequest
      )
      .pipe(
        finalize(() => {

          if (this.activeLogsRequest === subscription) {
            this.loading.set(false);
            this.activeLogsRequest = null;
          }
        })
      )
      .subscribe({

        next: response => {

          this.page.set(response.page);

          this.size.set(response.size);

          this.logs.set(
            response.content
          );

          this.totalPages.set(
            response.totalPages
          );

          this.totalElements.set(
            response.totalElements
          );
        },

        error: err => {

          console.error(err);

          this.error.set(
            'Failed to search logs'
          );
        }
      });

    this.activeLogsRequest = subscription;
  }

  // =========================
  // LOAD STATS
  // =========================

  loadStats(
    uploadId: string
  ): void {

    this.activeStatsRequest?.unsubscribe();

    this.statsLoading.set(true);

    let request:
      Subscription;

    request = this.logApi
      .getLogStats(uploadId)
      .pipe(
        finalize(() => {

          if (this.activeStatsRequest === request) {
            this.statsLoading.set(false);
            this.activeStatsRequest = null;
          }
        })
      )
      .subscribe({

        next: stats => {

          this.stats.set(stats);
        },

        error: err => {

          console.error(err);
        }
      });

    this.activeStatsRequest = request;
  }

  // =========================
  // SELECT LOG
  // =========================

  selectLog(
    log: LogResponseModel
  ): void {

    this.selectedLog.set(log);
  }

  // =========================
  // CLEAR SELECTION
  // =========================

  clearSelection(): void {

    this.selectedLog.set(null);
  }

  setHighlightedLogId(
    logId: number | null
  ): void {

    this.highlightedLogId.set(logId);
  }

  // =========================
  // SET PAGE
  // =========================

  setPage(
    page: number
  ): void {

    this.page.set(
      Math.max(0, page)
    );
  }

  setSize(
    size: number
  ): void {

    this.size.set(
      Math.min(
        Math.max(size, 1),
        100
      )
    );
  }

  // =========================
  // SET KEYWORD
  // =========================

  setKeyword(
    keyword: string
  ): void {

    if (this.keyword() === keyword) {
      return;
    }

    this.keyword.set(keyword);
  }

  // =========================
  // SET LEVEL
  // =========================

  setLevel(
    level: LogLevel | ''
  ): void {

    if (this.level() === level) {
      return;
    }

    this.level.set(level);
  }

  // =========================
  // SET SERVICE
  // =========================

  setServiceName(
    service: string
  ): void {

    if (this.serviceName() === service) {
      return;
    }

    this.serviceName.set(service);
  }

  // =========================
  // SET SORT
  // =========================

  setSort(
    sortBy: string,
    direction: 'asc' | 'desc'
  ): void {

    if (
      this.sortBy() === sortBy &&
      this.direction() === direction
    ) {
      return;
    }

    this.sortBy.set(sortBy);

    this.direction.set(direction);
  }

  private cancelLogsRequest(): void {

    this.activeLogsRequest?.unsubscribe();
    this.activeLogsRequest = null;
  }
}
