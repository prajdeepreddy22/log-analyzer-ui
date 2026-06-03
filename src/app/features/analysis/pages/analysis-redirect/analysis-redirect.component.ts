import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import {
  Router
} from '@angular/router';

import { UploadApiService } from '../../../../core/api/upload-api.service';

import { UploadStoreService } from '../../../../core/stores/upload-store.service';

import { UploadStatus } from '../../../../core/models/upload/upload-status.enum';

@Component({
  selector: 'app-analysis-redirect',
  standalone: true,
  imports: [
    CommonModule
  ],
  template: `
    <div class="redirect-state">
      Opening latest completed analysis...
    </div>
  `,
  styles: [`
    .redirect-state {
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text2);
      font-family: var(--mono);
      font-size: 12px;
    }
  `],
  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class AnalysisRedirectComponent
  implements OnInit {

  private readonly uploadApi =
    inject(UploadApiService);

  private readonly uploadStore =
    inject(UploadStoreService);

  private readonly router =
    inject(Router);

  ngOnInit(): void {

    const selected =
      this.uploadStore.selectedUpload();

    if (
      selected?.status ===
      UploadStatus.COMPLETED
    ) {

      this.router.navigate([
        '/analysis',
        selected.uploadId
      ]);

      return;
    }

    this.uploadApi
      .getUploads(
        0,
        1,
        UploadStatus.COMPLETED
      )
      .subscribe({

        next: response => {

          const latest =
            response.content[0];

          if (!latest) {

            this.router.navigate([
              '/uploads'
            ]);

            return;
          }

          this.uploadStore.selectUpload(
            latest
          );

          this.router.navigate([
            '/analysis',
            latest.uploadId
          ]);
        },

        error: () => {

          this.router.navigate([
            '/uploads'
          ]);
        }
      });
  }
}
