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
  FormsModule
} from '@angular/forms';

import { LogSourceStoreService } from '../../../../core/stores/log-source-store.service';
import {
  LogSourceModel,
  LogSourceStatus,
  LogSourceType
} from '../../../../core/models/settings/log-source.model';

@Component({
  selector: 'app-log-sources-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './log-sources-page.component.html',
  styleUrl: './log-sources-page.component.scss',
  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class LogSourcesPageComponent implements OnInit {

  readonly sourceStore =
    inject(LogSourceStoreService);

  readonly sourceName =
    signal('');

  readonly sourceType =
    signal<LogSourceType>('WATCHER');

  readonly sourceTypes: LogSourceType[] = [
    'WATCHER',
    'MANUAL',
    'INTEGRATION'
  ];

  ngOnInit(): void {

    this.sourceStore.loadSources();
  }

  updateSourceName(
    value: string
  ): void {

    this.sourceName.set(value);
    this.sourceStore.clearMessages();
  }

  updateSourceType(
    value: string
  ): void {

    this.sourceType.set(value as LogSourceType);
    this.sourceStore.clearMessages();
  }

  createSource(): void {

    const name =
      this.sourceName().trim();

    if (!name) {
      return;
    }

    this.sourceStore.createSource(
      name,
      this.sourceType()
    );

    this.sourceName.set('');
    this.sourceType.set('WATCHER');
  }

  toggleStatus(
    source: LogSourceModel
  ): void {

    const nextStatus: LogSourceStatus =
      source.status === 'ACTIVE'
        ? 'INACTIVE'
        : 'ACTIVE';

    this.sourceStore.updateStatus(
      source,
      nextStatus
    );
  }

  formatDate(
    value?: string | null
  ): string {

    if (!value) {
      return 'Never';
    }

    return new Intl.DateTimeFormat(
      undefined,
      {
        dateStyle: 'medium',
        timeStyle: 'short'
      }
    ).format(new Date(value));
  }

  typeLabel(
    value: LogSourceType
  ): string {

    return value.toLowerCase();
  }
}
