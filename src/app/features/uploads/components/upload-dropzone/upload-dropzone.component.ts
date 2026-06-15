import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  inject,
  signal
} from '@angular/core';

import { CommonModule } from '@angular/common';

import { UploadStoreService } from '../../../../core/stores/upload-store.service';

@Component({
  selector: 'app-upload-dropzone',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './upload-dropzone.component.html',
  styleUrl: './upload-dropzone.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UploadDropzoneComponent {

  private readonly uploadStore =
    inject(UploadStoreService);

  readonly isDragging =
    signal(false);

  readonly error =
    signal<string | null>(null);

  // =========================
  // DRAG EVENTS
  // =========================

  @HostListener('dragover', ['$event'])
  onDragOver(event: DragEvent): void {

    event.preventDefault();

    this.isDragging.set(true);
  }

  @HostListener('dragleave', ['$event'])
  onDragLeave(event: DragEvent): void {

    event.preventDefault();

    this.isDragging.set(false);
  }

  @HostListener('drop', ['$event'])
  onDrop(event: DragEvent): void {

    event.preventDefault();

    this.isDragging.set(false);

    const files =
      event.dataTransfer?.files;

    if (!files?.length) {
      return;
    }

    this.handleFile(files[0]);
  }

  // =========================
  // FILE PICKER
  // =========================

  onFileSelected(
    event: Event
  ): void {

    const input =
      event.target as HTMLInputElement;

    const file =
      input.files?.[0];

    if (!file) {
      return;
    }

    this.handleFile(file);

    input.value = '';
  }

  // =========================
  // VALIDATION
  // =========================

  private handleFile(
    file: File
  ): void {

    this.error.set(null);

    const allowedExtensions =
      ['log', 'txt'];

    const extension =
      file.name
        .split('.')
        .pop()
        ?.toLowerCase();

    if (
      !extension ||
      !allowedExtensions.includes(extension)
    ) {

      this.error.set(
        'Only .log and .txt files are allowed'
      );

      return;
    }

    const maxSize =
      10 * 1024 * 1024;

    if (file.size > maxSize) {

      this.error.set(
        'Maximum file size is 10MB'
      );

      return;
    }

    this.uploadStore.uploadFile(file);
  }
}
