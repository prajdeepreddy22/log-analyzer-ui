import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { UploadApiService } from '../../../../core/api/upload-api.service';
import { UploadResponseModel } from '../../../../core/models/upload/upload-response.model';
import { AnalysisStoreService } from '../../../../core/stores/analysis-store.service';
import { RateLimitStoreService } from '../../../../core/stores/rate-limit-store.service';
import { formatFileSize } from '../../../../core/utils/file-size.util';

@Component({
  selector: 'app-dashboard-home',

  standalone: true,

  imports: [
    CommonModule,
    RouterLink
  ],

  templateUrl: './dashboard-home.component.html',

  styleUrls: ['./dashboard-home.component.scss'],

  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class DashboardHomeComponent
  implements OnInit {

  private readonly uploadApi =
    inject(UploadApiService);

  readonly analysisStore =
    inject(AnalysisStoreService);

  readonly rateLimitStore =
    inject(RateLimitStoreService);

  readonly uploads =
    signal<UploadResponseModel[]>([]);

  readonly totalUploads =
    signal(0);

  readonly loading =
    signal(false);

  readonly completedUploads =
    computed(() =>
      this.uploads().filter(upload =>
        upload.status === 'COMPLETED'
      ).length
    );

  readonly knownErrors =
    computed(() =>
      this.uploads().reduce(
        (total, upload) =>
          total + (upload.errorCount || 0),
        0
      )
    );

  readonly knownWarnings =
    computed(() =>
      this.uploads().reduce(
        (total, upload) =>
          total + (upload.warnCount || 0),
        0
      )
    );

  readonly analysesRun =
    computed(() =>
      this.analysisStore.history().length
    );

  readonly highSeverityAnalyses =
    computed(() =>
      this.analysisStore.history()
        .filter(item =>
          (item.severityScore ?? 0) >= 4
        ).length
    );

  readonly severityBuckets =
    computed(() => {

      const buckets = {
        low: 0,
        medium: 0,
        high: 0
      };

      this.analysisStore.history()
        .forEach(item => {

          const severityScore =
            item.severityScore ?? 0;

          if (severityScore >= 4) {
            buckets.high += 1;
            return;
          }

          if (severityScore === 3) {
            buckets.medium += 1;
            return;
          }

          buckets.low += 1;
        });

      return buckets;
    });

  formatSize(
    upload: UploadResponseModel
  ): string {

    return formatFileSize(
      upload.fileSize,
      upload.fileSizeFormatted
    );
  }

  ngOnInit(): void {

    this.loading.set(true);

    this.uploadApi
      .getUploads(0, 5)
      .subscribe({

        next: response => {

          this.uploads.set(response.content);

          this.totalUploads.set(
            response.totalElements
          );

          this.loading.set(false);
        },

        error: () => {

          this.loading.set(false);
        }
      });

    this.analysisStore.loadHistory();

    this.rateLimitStore.refreshNow();
  }
}
