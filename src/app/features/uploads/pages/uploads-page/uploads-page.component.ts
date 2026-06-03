import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject
} from '@angular/core';

import { CommonModule } from '@angular/common';

import { UploadStoreService } from '../../../../core/stores/upload-store.service';

import { UploadDropzoneComponent } from '../../components/upload-dropzone/upload-dropzone.component';

import { UploadHistoryTableComponent } from '../../components/upload-history-table/upload-history-table.component';

import { UploadProgressCardComponent } from '../../components/upload-progress-card/upload-progress-card.component';

import { UploadEmptyStateComponent } from '../../components/upload-empty-state/upload-empty-state.component';

import { UploadPaginationComponent } from '../../components/upload-pagination/upload-pagination.component';

@Component({
  selector: 'app-uploads-page',
  standalone: true,
  imports: [
    CommonModule,
    UploadDropzoneComponent,
    UploadHistoryTableComponent,
    UploadProgressCardComponent,
    UploadEmptyStateComponent,
    UploadPaginationComponent
  ],
  templateUrl: './uploads-page.component.html',
  styleUrl: './uploads-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UploadsPageComponent
  implements OnInit {

  readonly uploadStore =
    inject(UploadStoreService);

  ngOnInit(): void {

    this.uploadStore.loadUploads();
  }
}
