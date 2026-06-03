import {
  ChangeDetectionStrategy,
  Component,
  inject
} from '@angular/core';

import { CommonModule } from '@angular/common';

import { UploadStoreService } from '../../../../core/stores/upload-store.service';

@Component({
  selector: 'app-upload-pagination',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './upload-pagination.component.html',
  styleUrl: './upload-pagination.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UploadPaginationComponent {

  readonly uploadStore =
    inject(UploadStoreService);

  previousPage(): void {

    if (!this.uploadStore.hasPreviousPage()) {
      return;
    }

    this.uploadStore.setPage(
      this.uploadStore.page() - 1
    );

    this.uploadStore.loadUploads();
  }

  nextPage(): void {

    if (!this.uploadStore.hasNextPage()) {
      return;
    }

    this.uploadStore.setPage(
      this.uploadStore.page() + 1
    );

    this.uploadStore.loadUploads();
  }

  changeSize(
    event: Event
  ): void {

    const size =
      Number(
        (event.target as HTMLSelectElement).value
      );

    this.uploadStore.setSize(size);
    this.uploadStore.setPage(0);
    this.uploadStore.loadUploads();
  }
}
