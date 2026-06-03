import {
  ChangeDetectionStrategy,
  Component,
  inject
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import { LogStoreService } from '../../../../core/stores/log-store.service';

@Component({
  selector: 'app-log-stats-bar',

  standalone: true,

  imports: [
    CommonModule
  ],

  templateUrl: './log-stats-bar.component.html',

  styleUrl: './log-stats-bar.component.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class LogStatsBarComponent {

  readonly logStore =
    inject(LogStoreService);
}