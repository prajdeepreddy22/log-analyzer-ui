import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import {
  ActivatedRoute,
  Router
} from '@angular/router';

import { AnalysisStoreService } from '../../../../core/stores/analysis-store.service';

import { UploadStoreService } from '../../../../core/stores/upload-store.service';
import { UploadApiService } from '../../../../core/api/upload-api.service';
import { UploadResponseModel } from '../../../../core/models/upload/upload-response.model';
import { UploadStatus } from '../../../../core/models/upload/upload-status.enum';

@Component({
  selector: 'app-analysis-page',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './analysis-page.component.html',
  styleUrl: './analysis-page.component.scss',
  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class AnalysisPageComponent
  implements OnInit, OnDestroy {

  private readonly route =
    inject(ActivatedRoute);

  private readonly router =
    inject(Router);

  readonly analysisStore =
    inject(AnalysisStoreService);

  readonly uploadStore =
    inject(UploadStoreService);

  private readonly uploadApi =
    inject(UploadApiService);

  readonly completedUploads =
    signal<UploadResponseModel[]>([]);

  readonly uploadsLoading =
    signal(false);

  readonly uploadId =
    signal('');

  readonly upload =
    computed(() =>
      this.uploadStore.selectedUploadById(
        this.uploadId()
      )
    );

  readonly title =
    computed(() =>
      this.upload()?.fileName ||
      `Upload ${this.uploadId().slice(0, 8)}`
    );

  readonly status =
    computed(() =>
      this.analysisStore.status() ||
      this.analysisStore.analysis()?.status ||
      'NOT RUN'
    );

  readonly severityScore =
    computed(() =>
      this.analysisStore.analysis()?.severityScore ?? 0
    );

  readonly severityLabel =
    computed(() =>
      this.getSeverityLabel(
        this.severityScore()
      )
    );

  readonly hasAnalysis =
    computed(() =>
      this.analysisStore.isCompleted() &&
      Boolean(
        this.analysisStore.analysis()?.summary ||
        this.analysisStore.analysis()?.rootCause ||
        this.analysisStore.analysis()?.fixSuggestion ||
        this.analysisStore.analysis()?.codeFix
      )
    );

  readonly isProcessing =
    this.analysisStore.isProcessing;

  readonly progressMessage =
    computed(() =>
      this.analysisStore.statusMessage() ||
      'Waiting for analysis status...'
    );

  ngOnInit(): void {

    this.uploadId.set(
      this.resolveInitialUploadId()
    );

    this.loadCompletedUploads();

    if (this.uploadId()) {
      this.analysisStore.loadStatusThenAnalysis(
        this.uploadId()
      );
    }

    this.analysisStore.loadHistory();
  }

  ngOnDestroy(): void {

    this.analysisStore.stopPolling();
  }

  runAnalysis(): void {

    this.analysisStore.triggerAnalysis(
      this.uploadId(),
      this.hasAnalysis()
    );
  }

  openChat(): void {

    this.router.navigate(
      ['/chat'],
      {
        queryParams: {
          uploadId: this.uploadId()
        }
      }
    );
  }

  openLogs(): void {

    this.router.navigate([
      '/logs',
      this.uploadId()
    ]);
  }

  openHistoryItem(
    uploadId: string | undefined
  ): void {

    if (!uploadId) {
      return;
    }

    this.selectUpload(uploadId);
  }

  selectUploadFromEvent(
    event: Event
  ): void {

    const uploadId =
      (event.target as HTMLSelectElement).value;

    this.selectUpload(uploadId);
  }

  selectUpload(
    uploadId: string
  ): void {

    if (!uploadId) {
      return;
    }

    const upload =
      this.completedUploads().find(item =>
        item.uploadId === uploadId
      ) ||
      this.uploadStore.selectedUploadById(
        uploadId
      );

    if (upload) {
      this.uploadStore.selectUpload(upload);
    }

    this.uploadId.set(uploadId);

    this.router.navigate(
      [
        '/analysis',
        uploadId
      ],
      {
        queryParams: {
          uploadId
        },
        replaceUrl: false
      }
    );

    this.analysisStore.loadStatusThenAnalysis(
      uploadId
    );
  }

  isSeverityActive(
    block: number
  ): boolean {

    return this.severityScore() >= block;
  }

  private getSeverityLabel(
    score: number
  ): string {

    if (score >= 5) {
      return 'CRITICAL';
    }

    if (score >= 4) {
      return 'HIGH';
    }

    if (score >= 3) {
      return 'MEDIUM';
    }

    if (score >= 1) {
      return 'LOW';
    }

    return 'UNKNOWN';
  }

  private resolveInitialUploadId(): string {

    return (
      this.route.snapshot.paramMap.get('uploadId') ||
      this.route.snapshot.queryParamMap.get('uploadId') ||
      this.uploadStore.selectedUpload()?.uploadId ||
      ''
    );
  }

  private loadCompletedUploads(): void {

    this.uploadsLoading.set(true);

    this.uploadApi
      .getUploads(
        0,
        100,
        UploadStatus.COMPLETED
      )
      .subscribe({

        next: response => {

          this.completedUploads.set(
            response.content
          );

          this.uploadStore.setUploads(
            response.content
          );

          const selected =
            response.content.find(upload =>
              upload.uploadId === this.uploadId()
            ) ||
            this.uploadStore.selectedUpload();

          if (selected?.status === UploadStatus.COMPLETED) {
            this.uploadStore.selectUpload(selected);

            if (!this.uploadId()) {
              this.selectUpload(selected.uploadId);
            }
          }

          this.uploadsLoading.set(false);
        },

        error: () => {

          this.uploadsLoading.set(false);
        }
      });
  }
}
