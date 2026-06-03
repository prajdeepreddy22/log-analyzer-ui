import {
  Component,
  ChangeDetectionStrategy,
  inject,
  input
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import { LogStoreService } from '../../../../core/stores/log-store.service';

import { LogResponseModel } from '../../../../core/models/log/log-response.model';

import {
  Router
} from '@angular/router';

import { LogLoadingStateComponent } from '../log-loading-state/log-loading-state.component';

@Component({
  selector: 'app-log-table',

  standalone: true,

  imports: [
    CommonModule,
    LogLoadingStateComponent
  ],

  templateUrl: './log-table.component.html',

  styleUrl: './log-table.component.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class LogTableComponent
{

  readonly logStore =
    inject(LogStoreService);

  private readonly router =
    inject(Router);

  readonly uploadId =
    input.required<string>();

  trackByLog(
    index: number,
    log: LogResponseModel
  ): number {

    return log.id ?? index;
  }

  selectLog(
    log: LogResponseModel
  ): void {

    this.logStore.selectLog(
      log
    );
  }

  clearSelection(): void {

    this.logStore.clearSelection();
  }

  isSelected(
    log: LogResponseModel
  ): boolean {

    return (
      this.logStore.selectedLog()?.id ===
      log.id
    );
  }

  isHighlighted(
    log: LogResponseModel
  ): boolean {

    return (
      this.logStore.highlightedLogId() ===
      log.id
    );
  }

  getLevelClass(
    level: string
  ): string {

    switch (level) {

      case 'ERROR':
      case 'FATAL':
        return 'error';

      case 'WARN':
        return 'warn';

      case 'INFO':
        return 'info';

      default:
        return '';
    }
  }

  sort(
    sortBy: string
  ): void {

    const nextDirection =
      this.logStore.sortBy() === sortBy &&
      this.logStore.direction() === 'desc'
        ? 'asc'
        : 'desc';

    this.logStore.setSort(
      sortBy,
      nextDirection
    );

    this.logStore.setPage(0);

    this.syncQueryParams();

    if (this.logStore.hasActiveFilters()) {
      this.logStore.searchLogs(
        this.uploadId()
      );
      return;
    }

    this.logStore.loadLogs(
      this.uploadId()
    );
  }

  sortIndicator(
    sortBy: string
  ): string {

    if (this.logStore.sortBy() !== sortBy) {
      return '';
    }

    return this.logStore.direction() === 'asc'
      ? 'UP'
      : 'DOWN';
  }

  ariaSort(
    sortBy: string
  ): 'ascending' | 'descending' | 'none' {

    if (this.logStore.sortBy() !== sortBy) {
      return 'none';
    }

    return this.logStore.direction() === 'asc'
      ? 'ascending'
      : 'descending';
  }

  logAriaLabel(
    log: LogResponseModel
  ): string {

    return [
      `Log ${log.logSequence}`,
      log.level,
      log.serviceName,
      log.message
    ]
      .filter(Boolean)
      .join(', ');
  }

  private syncQueryParams(): void {

    this.router.navigate(
      [],
      {
        queryParams: {
          level:
            this.logStore.level() || null,

          search:
            this.logStore.keyword() || null,

          service:
            this.logStore.serviceName() || null,

          page:
            this.logStore.page() || null,

          size:
            this.logStore.size(),

          sortBy:
            this.logStore.sortBy(),

          direction:
            this.logStore.direction()
        },
        queryParamsHandling: 'merge',
        replaceUrl: true
      }
    );
  }
}
