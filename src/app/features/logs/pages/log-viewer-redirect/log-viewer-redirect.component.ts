import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import {
  Router
} from '@angular/router';

import { UploadApiService } from '../../../../core/api/upload-api.service';

import { UploadStoreService } from '../../../../core/stores/upload-store.service';

import { UploadResponseModel } from '../../../../core/models/upload/upload-response.model';

import { UploadStatus } from '../../../../core/models/upload/upload-status.enum';

@Component({
  selector: 'app-log-viewer-redirect',

  standalone: true,

  imports: [
    CommonModule
  ],

  template: `
    <section class="log-picker-page">

      <div class="picker-header">
        <div>
          <p class="eyebrow">
            LOG VIEWER
          </p>

          <h1>
            Select an upload
          </h1>

          <p class="subtitle">
            Open a completed upload to inspect logs, filters, and AI analysis.
          </p>
        </div>

        <button
          class="primary-action"
          type="button"
          (click)="goToUploads()"
        >
          Upload Logs
        </button>
      </div>

      @if (loading()) {

        <div class="state-card">
          Loading completed uploads...
        </div>

      } @else if (error()) {

        <div class="state-card error">
          {{ error() }}
        </div>

      } @else if (!uploads().length) {

        <div class="state-card">
          No completed uploads found. Upload a log file first.
        </div>

      } @else {

        <div class="upload-list">

          @for (
            upload of uploads();
            track upload.uploadId
          ) {

            <button
              class="upload-row"
              type="button"
              (click)="openLogs(upload)"
            >
              <span class="file-name">
                {{ upload.fileName }}
              </span>

              <span class="upload-meta">
                {{ upload.totalLogs ?? '-' }} logs
                /
                {{ upload.errorCount ?? 0 }} errors
                /
                {{ upload.warnCount ?? 0 }} warnings
              </span>

              <span class="status-pill">
                {{ upload.status }}
              </span>
            </button>
          }

        </div>
      }

    </section>
  `,

  styles: [`
    :host {
      display: block;
      min-height: 100%;
    }

    .log-picker-page {
      min-height: 100%;
      padding: 16px 18px 20px;
      background: var(--bg);
      color: var(--text);
    }

    .picker-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 14px;
      margin-bottom: 14px;
    }

    .eyebrow {
      margin: 0 0 4px;
      color: var(--purple);
      font-family: var(--mono);
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 1px;
    }

    h1 {
      margin: 0;
      font-size: 22px;
      font-weight: 700;
    }

    .subtitle {
      margin: 4px 0 0;
      color: var(--text2);
      font-size: 12px;
    }

    .primary-action {
      height: 34px;
      padding: 0 12px;
      color: var(--text);
      background: var(--purple);
      border: 0;
      border-radius: var(--radius);
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
    }

    .state-card,
    .upload-list {
      background: var(--bg2);
      border: 1px solid var(--border);
      border-radius: var(--radius);
    }

    .state-card {
      padding: 18px;
      color: var(--text2);
      font-family: var(--mono);
      font-size: 12px;
    }

    .state-card.error {
      color: var(--red);
      background: var(--red-bg);
      border-color: var(--red-border);
    }

    .upload-list {
      overflow: hidden;
    }

    .upload-row {
      width: 100%;
      min-height: 52px;
      padding: 10px 12px;
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(220px, auto) auto;
      align-items: center;
      gap: 12px;
      color: inherit;
      background: transparent;
      border: 0;
      border-bottom: 1px solid var(--border);
      text-align: left;
      cursor: pointer;
    }

    .upload-row:last-child {
      border-bottom: 0;
    }

    .upload-row:hover {
      background: var(--bg3);
    }

    .file-name {
      min-width: 0;
      overflow: hidden;
      color: var(--text);
      font-family: var(--mono);
      font-size: 12px;
      font-weight: 600;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .upload-meta {
      color: var(--text3);
      font-family: var(--mono);
      font-size: 10px;
    }

    .status-pill {
      padding: 5px 8px;
      color: var(--green);
      background: var(--green-bg);
      border: 1px solid var(--green-border);
      border-radius: var(--radius-sm);
      font-family: var(--mono);
      font-size: 10px;
      font-weight: 700;
    }

    @media (max-width: 768px) {
      .picker-header {
        flex-direction: column;
      }

      .upload-row {
        grid-template-columns: 1fr;
      }
    }
  `],

  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class LogViewerRedirectComponent
  implements OnInit {

  private readonly uploadApi =
    inject(UploadApiService);

  private readonly uploadStore =
    inject(UploadStoreService);

  private readonly router =
    inject(Router);

  readonly uploads =
    signal<UploadResponseModel[]>([]);

  readonly loading =
    signal(false);

  readonly error =
    signal<string | null>(null);

  ngOnInit(): void {

    this.loading.set(true);
    this.error.set(null);

    this.uploadApi
      .getUploads(
        0,
        20,
        UploadStatus.COMPLETED
      )
      .subscribe({

        next: response => {

          this.uploads.set(response.content);

          this.uploadStore.setUploads(
            response.content
          );

          this.loading.set(false);
        },

        error: () => {

          this.loading.set(false);

          this.error.set(
            'Unable to load completed uploads. Check backend/API connection, then try Uploads.'
          );
        }
      });
  }

  openLogs(
    upload: UploadResponseModel
  ): void {

    this.uploadStore.selectUpload(upload);

    this.router.navigate([
      '/logs',
      upload.uploadId
    ]);
  }

  goToUploads(): void {

    this.router.navigate([
      '/uploads'
    ]);
  }
}
