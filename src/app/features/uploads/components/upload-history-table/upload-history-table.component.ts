import {
  ChangeDetectionStrategy,
  Component,
  inject
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  Router,
  RouterModule
} from '@angular/router';

import { UploadStoreService } from '../../../../core/stores/upload-store.service';

import { UploadStatusBadgeComponent } from '../upload-status-badge/upload-status-badge.component';

import { UploadResponseModel } from '../../../../core/models/upload/upload-response.model';

import { UploadStatus } from '../../../../core/models/upload/upload-status.enum';

import { formatFileSize } from '../../../../core/utils/file-size.util';

@Component({
  selector: 'app-upload-history-table',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    UploadStatusBadgeComponent
  ],
  templateUrl: './upload-history-table.component.html',
  styleUrl: './upload-history-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UploadHistoryTableComponent {

  readonly uploadStore =
    inject(UploadStoreService);

  private readonly router =
    inject(Router);

  readonly UploadStatus =
    UploadStatus;

  formatSize(
    upload: UploadResponseModel
  ): string {

    return formatFileSize(
      upload.fileSize,
      upload.fileSizeFormatted
    );
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

  openAnalysis(
    upload: UploadResponseModel
  ): void {

    this.uploadStore.selectUpload(upload);

    this.router.navigate([
      '/analysis',
      upload.uploadId
    ]);
  }

  deleteUpload(
    upload: UploadResponseModel
  ): void {

    const confirmed =
      window.confirm(
        `Delete ${upload.fileName}? This removes the upload and its parsed log data.`
      );

    if (!confirmed) {
      return;
    }

    this.uploadStore.deleteUpload(
      upload.uploadId
    );
  }
}
