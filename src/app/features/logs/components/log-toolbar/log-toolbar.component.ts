import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  computed
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import { LogStoreService } from '../../../../core/stores/log-store.service';

import { AnalysisStoreService } from '../../../../core/stores/analysis-store.service';

import { UploadStoreService } from '../../../../core/stores/upload-store.service';

@Component({
  selector: 'app-log-toolbar',

  standalone: true,

  imports: [
    CommonModule
  ],

  templateUrl: './log-toolbar.component.html',

  styleUrl: './log-toolbar.component.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class LogToolbarComponent {

  readonly logStore =
    inject(LogStoreService);

  readonly analysisStore =
    inject(AnalysisStoreService);

  readonly uploadStore =
    inject(UploadStoreService);

  readonly uploadId =
    input.required<string>();

  readonly upload =
    computed(() => {

      const selected =
        this.uploadStore.selectedUpload();

      if (
        selected?.uploadId ===
        this.uploadId()
      ) {
        return selected;
      }

      return this.uploadStore.selectedUploadById(
        this.uploadId()
      );
    });

  readonly title =
    computed(() =>
      this.upload()?.fileName ||
      `Upload ${this.uploadId().slice(0, 8)}`
    );

  readonly status =
    computed(() =>
      this.upload()?.status ||
      'COMPLETED'
    );

  readonly analyzing =
    computed(() =>
      this.analysisStore.loading() ||
      this.analysisStore.status() === 'PROCESSING' ||
      this.analysisStore.status() === 'RETRYING'
    );

  refresh(): void {

    this.logStore.loadLogs(
      this.uploadId()
    );

    this.logStore.loadStats(
      this.uploadId()
    );
  }

  analyze(): void {

    this.analysisStore.triggerAnalysis(
      this.uploadId()
    );
  }

  exportLogs(): void {

    const rows =
      this.logStore.logs();

    if (!rows.length) {
      return;
    }

    const header = [
      'sequence',
      'timestamp',
      'level',
      'service',
      'message'
    ];

    const csv = [
      header.join(','),
      ...rows.map(log =>
        [
          log.logSequence,
          log.logTimestamp,
          log.level,
          log.serviceName,
          log.message
        ]
          .map(value =>
            this.escapeCsv(value)
          )
          .join(',')
      )
    ].join('\n');

    const blob =
      new Blob(
        [csv],
        {
          type: 'text/csv;charset=utf-8'
        }
      );

    const url =
      URL.createObjectURL(blob);

    const anchor =
      document.createElement('a');

    anchor.href = url;
    anchor.download =
      `${this.title()}-logs.csv`;

    anchor.click();

    URL.revokeObjectURL(url);
  }

  private escapeCsv(
    value: unknown
  ): string {

    const text =
      String(value ?? '');

    return `"${text.replace(/"/g, '""')}"`;
  }
}
