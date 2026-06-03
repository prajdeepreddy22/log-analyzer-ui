import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  input
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import {
  Router
} from '@angular/router';

import {
  Subject
} from 'rxjs';

import {
  debounceTime
} from 'rxjs/operators';

import {
  takeUntilDestroyed
} from '@angular/core/rxjs-interop';

import { LogStoreService }
from '../../../../core/stores/log-store.service';

import { LogLevel }
from '../../../../core/models/log/log-level.enum';

@Component({
  selector: 'app-log-filters',

  standalone: true,

  imports: [
    CommonModule
  ],

  templateUrl: './log-filters.component.html',

  styleUrl: './log-filters.component.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class LogFiltersComponent
  implements OnInit {

  readonly logStore =
    inject(LogStoreService);

  private readonly router =
    inject(Router);

  private readonly destroyRef =
    inject(DestroyRef);

  private readonly searchInput$ =
    new Subject<void>();

  readonly uploadId =
    input.required<string>();

  // EXPOSE ENUM TO TEMPLATE

  readonly LogLevel =
    LogLevel;

  ngOnInit(): void {

    this.searchInput$
      .pipe(
        debounceTime(350),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() =>
        this.search()
      );
  }

  search(): void {

    this.logStore.setPage(0);

    this.syncQueryParams();

    this.reload();
  }

  setLevel(
    level: '' | LogLevel
  ): void {

    this.logStore.setLevel(
      level
    );

    this.search();
  }

  setKeyword(
    event: Event
  ): void {

    const keyword =
      (event.target as HTMLInputElement).value;

    this.logStore.setKeyword(keyword);

    this.searchInput$.next();
  }

  setServiceName(
    event: Event
  ): void {

    const service =
      (event.target as HTMLInputElement).value;

    this.logStore.setServiceName(service);

    this.searchInput$.next();
  }

  clearFilters(): void {

    this.logStore.setKeyword('');
    this.logStore.setServiceName('');
    this.logStore.setLevel('');
    this.logStore.setPage(0);

    this.syncQueryParams();

    this.logStore.loadLogs(
      this.uploadId()
    );
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
