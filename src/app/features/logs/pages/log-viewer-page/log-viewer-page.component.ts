import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  inject
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import {
  ActivatedRoute
} from '@angular/router';

import { LogStoreService } from '../../../../core/stores/log-store.service';

import { AnalysisStoreService } from '../../../../core/stores/analysis-store.service';

import { UploadStoreService } from '../../../../core/stores/upload-store.service';

import { LogToolbarComponent } from '../../components/log-toolbar/log-toolbar.component';

import { LogFiltersComponent } from '../../components/log-filters/log-filters.component';

import { LogStatsBarComponent } from '../../components/log-stats-bar/log-stats-bar.component';

import { LogTableComponent } from '../../components/log-table/log-table.component';

import { LogAiPanelComponent } from '../../components/log-ai-panel/log-ai-panel.component';

import { LogPaginationComponent } from '../../components/log-pagination/log-pagination.component';

import { LogLevel } from '../../../../core/models/log/log-level.enum';

@Component({
  selector: 'app-log-viewer-page',

  standalone: true,

  imports: [
    CommonModule,
    LogToolbarComponent,
    LogFiltersComponent,
    LogStatsBarComponent,
    LogTableComponent,
    LogPaginationComponent,
    LogAiPanelComponent
  ],

  templateUrl: './log-viewer-page.component.html',

  styleUrl: './log-viewer-page.component.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class LogViewerPageComponent
  implements OnInit, OnDestroy {

  private readonly route =
    inject(ActivatedRoute);

  readonly logStore =
    inject(LogStoreService);

  private readonly analysisStore =
    inject(AnalysisStoreService);

  private readonly uploadStore =
    inject(UploadStoreService);

  uploadId = '';

  ngOnInit(): void {

    this.uploadId =
      this.route.snapshot.paramMap.get(
        'uploadId'
      ) || '';

    if (!this.uploadId) {
      return;
    }

    if (!this.uploadStore.hasUploads()) {

      this.uploadStore.loadUploads();
    }

    this.applyQueryParams();

    // =====================
    // LOAD LOGS
    // =====================

    if (this.hasActiveSearch()) {

      this.logStore.searchLogs(
        this.uploadId
      );

    } else {

      this.logStore.loadLogs(
        this.uploadId
      );
    }

    // =====================
    // LOAD STATS
    // =====================

    this.logStore.loadStats(
      this.uploadId
    );

    if (
      this.route.snapshot.queryParamMap.get(
        'analyze'
      ) === 'true'
    ) {

      this.analysisStore.triggerAnalysis(
        this.uploadId
      );
    }
  }

  ngOnDestroy(): void {

    this.logStore.stopActiveRequests();
    this.analysisStore.stopPolling();
  }

  private applyQueryParams(): void {

    const params =
      this.route.snapshot.queryParamMap;

    this.logStore.setKeyword(
      params.get('search') || ''
    );

    this.logStore.setServiceName(
      params.get('service') || ''
    );

    this.logStore.setLevel(
      this.toLogLevel(
        params.get('level')
      )
    );

    this.logStore.setPage(
      Number(params.get('page') || 0)
    );

    this.logStore.setSize(
      Number(params.get('size') || this.logStore.size())
    );

    const highlight =
      params.get('highlight');

    this.logStore.setHighlightedLogId(
      highlight ? Number(highlight) : null
    );

    const sortBy =
      params.get('sortBy');

    const direction =
      params.get('direction');

    if (sortBy) {

      this.logStore.setSort(
        sortBy,
        direction === 'asc' ? 'asc' : 'desc'
      );
    }
  }

  private hasActiveSearch(): boolean {

    return this.logStore.hasActiveFilters();
  }

  private toLogLevel(
    level: string | null
  ): LogLevel | '' {

    if (
      level &&
      Object.values(LogLevel).includes(
        level as LogLevel
      )
    ) {
      return level as LogLevel;
    }

    return '';
  }
}
