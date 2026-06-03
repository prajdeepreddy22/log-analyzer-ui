import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import {
  ReferencedLogModel
} from '../../../../core/models/chat/chat-message.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-referenced-log-card',

  standalone: true,

  imports: [
    CommonModule
  ],

  templateUrl:
    './referenced-log-card.component.html',

  styleUrl:
    './referenced-log-card.component.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class ReferencedLogCardComponent {

  readonly log =
    input.required<ReferencedLogModel>();

  readonly uploadId =
    input<string>('');

  private readonly router =
    inject(Router);

  readonly canNavigate =
    computed(() =>
      Boolean(this.uploadId())
    );

  openLog(): void {

    if (!this.uploadId()) {
      return;
    }

    this.router.navigate(
      [
        '/logs',
        this.uploadId()
      ],
      {
        queryParams: {
          highlight: this.log().id
        },
        queryParamsHandling: 'merge'
      }
    );
  }

  getLevelClass(): string {

    switch (this.log().level) {

      case 'ERROR':
      case 'FATAL':
        return 'error';

      case 'WARN':
        return 'warn';

      case 'INFO':
        return 'info';

      default:
        return '';
    }
  }
}
