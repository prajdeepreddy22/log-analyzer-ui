import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import {
  Router
} from '@angular/router';

import { LogStoreService } from '../../../../core/stores/log-store.service';

@Component({
  selector: 'app-log-pagination',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './log-pagination.component.html',
  styleUrl: './log-pagination.component.scss',
  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class LogPaginationComponent {

  readonly logStore =
    inject(LogStoreService);

  private readonly router =
    inject(Router);

  readonly uploadId =
    input.required<string>();

  previousPage(): void {

    if (this.logStore.page() <= 0) {
      return;
    }

    this.goToPage(
      this.logStore.page() - 1
    );
  }

  nextPage(): void {

    if (
      this.logStore.page() >=
      this.logStore.totalPages() - 1
    ) {
      return;
    }

    this.goToPage(
      this.logStore.page() + 1
    );
  }

  changeSize(
    event: Event
  ): void {

    const size =
      Number(
        (event.target as HTMLSelectElement).value
      );

    this.logStore.setSize(size);
    this.logStore.setPage(0);
    this.syncQueryParams();
    this.reload();
  }

  private goToPage(
    page: number
  ): void {

    this.logStore.setPage(page);
    this.syncQueryParams();
    this.reload();
  }

  private reload(): void {

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
