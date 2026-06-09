import {
  Injectable,
  computed,
  inject,
  signal
} from '@angular/core';

import {
  HttpEventType
} from '@angular/common/http';

import {
  finalize,
  interval,
  startWith,
  Subscription,
  switchMap,
  takeWhile
} from 'rxjs';

import { UploadApiService } from '../api/upload-api.service';

import { UploadResponseModel } from '../models/upload/upload-response.model';
import { UploadStatusResponseModel } from '../models/upload/upload-status-response.model';
import { UploadStatus } from '../models/upload/upload-status.enum';

@Injectable({
  providedIn: 'root'
})
export class UploadStoreService {

  private readonly uploadApi =
    inject(UploadApiService);

  private uploadSubscription:
    Subscription | null = null;

  private loadUploadsSubscription:
    Subscription | null = null;

  private readonly pollingSubscriptions =
    new Map<string, Subscription>();

  // =========================
  // STATE
  // =========================

  readonly uploads =
    signal<UploadResponseModel[]>([]);

  readonly selectedUpload =
    signal<UploadResponseModel | null>(null);

  readonly loading =
    signal(false);

  readonly uploading =
    signal(false);

  readonly uploadProgress =
    signal(0);

  readonly uploadFileName =
    signal<string | null>(null);

  readonly error =
    signal<string | null>(null);

  readonly page =
    signal(0);

  readonly size =
    signal(10);

  readonly totalPages =
    signal(0);

  readonly totalElements =
    signal(0);

  // =========================
  // COMPUTED
  // =========================

  readonly hasUploads = computed(() =>
    this.uploads().length > 0
  );

  readonly hasPreviousPage = computed(() =>
    this.page() > 0
  );

  readonly hasNextPage = computed(() =>
    this.totalPages() > 0 &&
    this.page() < this.totalPages() - 1
  );

  selectedUploadById(
    uploadId: string
  ): UploadResponseModel | null {

    const upload =
      this.uploads().find(item =>
        item.uploadId === uploadId
      );

    if (upload) {
      return upload;
    }

    const cached =
      sessionStorage.getItem(
        this.cacheKey(uploadId)
      );

    if (!cached) {
      return null;
    }

    try {
      return JSON.parse(cached) as
        UploadResponseModel;
    } catch {
      return null;
    }
  }

  selectUpload(
    upload: UploadResponseModel
  ): void {

    this.selectedUpload.set(upload);

    this.cacheUpload(upload);
  }

  setUploads(
    uploads: UploadResponseModel[]
  ): void {

    this.uploads.set(uploads);

    uploads.forEach(upload =>
      this.cacheUpload(upload)
    );
  }

  setPage(
    page: number
  ): void {

    this.page.set(
      Math.max(page, 0)
    );
  }

  setSize(
    size: number
  ): void {

    this.size.set(
      Math.min(
        Math.max(size, 1),
        100
      )
    );
  }

  // =========================
  // LOAD UPLOADS
  // =========================

  loadUploads(): void {

    this.loadUploadsSubscription?.unsubscribe();

    this.loading.set(true);

    this.error.set(null);

    let subscription:
      Subscription;

    subscription = this.uploadApi
      .getUploads(
        this.page(),
        this.size()
      )
      .pipe(
        finalize(() => {

          if (
            this.loadUploadsSubscription ===
            subscription
          ) {
            this.loading.set(false);
            this.loadUploadsSubscription = null;
          }
        })
      )
      .subscribe({

        next: response => {

          this.setUploads(response.content);

          this.page.set(response.page);

          this.size.set(response.size);

          this.totalElements.set(
            response.totalElements
          );

          this.totalPages.set(
            response.totalPages
          );
        },

        error: err => {

          console.error(err);

          this.error.set(
            'Failed to load uploads'
          );
        }
      });

    this.loadUploadsSubscription = subscription;
  }

  // =========================
  // UPLOAD FILE
  // =========================

  uploadFile(
    file: File
  ): void {

    if (this.isDuplicateUpload(file)) {

      this.error.set(
        'This file is already in upload history.'
      );

      return;
    }

    this.uploading.set(true);

    this.uploadProgress.set(0);

    this.uploadFileName.set(file.name);

    this.error.set(null);

    this.uploadSubscription =
      this.uploadApi
      .uploadFile(file)
      .pipe(
        finalize(() => {

          this.uploading.set(false);

          this.uploadSubscription = null;
        })
      )
      .subscribe({

        // =====================
        // EVENTS
        // =====================

        next: event => {

          // =====================
          // PROGRESS
          // =====================

          if (
            event.type ===
            HttpEventType.UploadProgress
          ) {

            const progress =
              Math.round(
                100 *
                (
                  event.loaded /
                  (event.total || 1)
                )
              );

            this.uploadProgress.set(
              progress
            );
          }

          // =====================
          // RESPONSE
          // =====================

          if (
            event.type ===
            HttpEventType.Response
          ) {

            const upload =
              event.body;

            if (!upload) {
              return;
            }

            // =====================
            // REFRESH TABLE
            // =====================

            this.setPage(0);

            this.loadUploads();

            // =====================
            // START POLLING
            // =====================

            this.pollUploadStatus(
              upload.uploadId
            );
          }
        },

        // =====================
        // ERROR
        // =====================

        error: err => {

          console.error(err);

          this.error.set(
            'Upload failed'
          );
        }
      });
  }

  cancelUpload(): void {

    if (!this.uploadSubscription) {
      return;
    }

    this.uploadSubscription.unsubscribe();

    this.uploadSubscription = null;

    this.uploading.set(false);

    this.uploadProgress.set(0);

    this.uploadFileName.set(null);

    this.error.set(
      'Upload cancelled'
    );
  }

  // =========================
  // DELETE UPLOAD
  // =========================

  deleteUpload(
    uploadId: string
  ): void {

    this.loading.set(true);

    this.error.set(null);

    this.uploadApi
      .deleteUpload(uploadId)
      .pipe(
        finalize(() =>
          this.loading.set(false)
        )
      )
      .subscribe({

        next: () => {

          if (
            this.selectedUpload()?.uploadId ===
            uploadId
          ) {
            this.selectedUpload.set(null);
          }

          sessionStorage.removeItem(
            this.cacheKey(uploadId)
          );

          if (
            this.uploads().length === 1 &&
            this.page() > 0
          ) {
            this.setPage(
              this.page() - 1
            );
          }

          this.loadUploads();
        },

        error: err => {

          console.error(err);

          this.error.set(
            'Failed to delete upload'
          );
        }
      });

  }

  // =========================
  // POLLING
  // =========================

  pollUploadStatus(
    uploadId: string
  ): void {

    this.pollingSubscriptions
      .get(uploadId)
      ?.unsubscribe();

    const subscription =
      interval(2000)
      .pipe(

        startWith(0),

        switchMap(() =>
          this.uploadApi.getUploadStatus(
            uploadId
          )
        ),

        takeWhile(
          status =>

            status.status !==
              UploadStatus.COMPLETED &&

            status.status !==
              UploadStatus.FAILED,

          true
        )
      )
      .subscribe({

        next: status => {

          this.updateUploadStatus(
            uploadId,
            status
          );
        },

        error: err => {

          console.error(err);

          this.pollingSubscriptions.delete(
            uploadId
          );
        },

        complete: () => {

          this.pollingSubscriptions.delete(
            uploadId
          );
        }
      });

    this.pollingSubscriptions.set(
      uploadId,
      subscription
    );
  }

  stopActiveWork(): void {

    this.uploadSubscription?.unsubscribe();
    this.loadUploadsSubscription?.unsubscribe();

    this.uploadSubscription = null;
    this.loadUploadsSubscription = null;

    this.pollingSubscriptions
      .forEach(subscription =>
        subscription.unsubscribe()
      );

    this.pollingSubscriptions.clear();

    this.uploading.set(false);
    this.loading.set(false);
    this.uploadProgress.set(0);
    this.uploadFileName.set(null);
  }

  // =========================
  // UPDATE STATUS
  // =========================

  private updateUploadStatus(
    uploadId: string,
    status: UploadStatusResponseModel
  ): void {

    const updated =
      this.uploads().map(upload => {

        if (
          upload.uploadId === uploadId
        ) {

          return {

            ...upload,

            // =====================
            // STATUS
            // =====================

            status: status.status,

            // =====================
            // OBSERVABILITY METRICS
            // =====================

            totalLogs: status.totalLogs,

            errorCount: status.errorCount,

            warnCount: status.warnCount
          };
        }

        return upload;
      });

    this.uploads.set(updated);

    const upload =
      updated.find(item =>
        item.uploadId === uploadId
      );

    if (upload) {
      this.cacheUpload(upload);
    }
  }

  private isDuplicateUpload(
    file: File
  ): boolean {

    return this.uploads().some(upload =>
      upload.fileName === file.name &&
      upload.fileSize === file.size &&
      upload.status !== UploadStatus.FAILED
    );
  }

  private cacheUpload(
    upload: UploadResponseModel
  ): void {

    sessionStorage.setItem(
      this.cacheKey(upload.uploadId),
      JSON.stringify(upload)
    );
  }

  private cacheKey(
    uploadId: string
  ): string {

    return `logai_upload_${uploadId}`;
  }
}
