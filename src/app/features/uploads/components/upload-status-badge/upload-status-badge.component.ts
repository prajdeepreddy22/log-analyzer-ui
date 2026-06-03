import {
  ChangeDetectionStrategy,
  Component,
  input
} from '@angular/core';

import { CommonModule } from '@angular/common';

import { UploadStatus } from '../../../../core/models/upload/upload-status.enum';

@Component({
  selector: 'app-upload-status-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './upload-status-badge.component.html',
  styleUrl: './upload-status-badge.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UploadStatusBadgeComponent {

  readonly status =
    input.required<UploadStatus>();

  get badgeClass(): string {

    switch (this.status()) {

      case UploadStatus.COMPLETED:
        return 'success';

      case UploadStatus.PROCESSING:
        return 'warning';

      case UploadStatus.FAILED:
        return 'danger';

      default:
        return 'info';
    }
  }
}