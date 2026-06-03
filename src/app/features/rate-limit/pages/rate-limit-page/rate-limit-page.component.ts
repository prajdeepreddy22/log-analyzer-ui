import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  inject
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import { RateLimitStoreService } from '../../../../core/stores/rate-limit-store.service';

@Component({
  selector: 'app-rate-limit-page',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './rate-limit-page.component.html',
  styleUrl: './rate-limit-page.component.scss',
  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class RateLimitPageComponent
  implements OnInit, OnDestroy {

  readonly rateLimitStore =
    inject(RateLimitStoreService);

  ngOnInit(): void {

    this.rateLimitStore.refreshNow();
  }

  ngOnDestroy(): void {

    this.rateLimitStore.stopPolling();
    this.rateLimitStore.stopCountdowns();
  }
}
