import {
  Component,
  DestroyRef,
  OnInit,
  inject
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { AuthStoreService } from './core/stores/auth-store.service';
import { AuthService } from './core/services/auth.service';
import { RateLimitStoreService } from './core/stores/rate-limit-store.service';
import { SessionEventsService } from './core/services/session-events.service';
import { RealtimeEventStoreService } from './core/stores/realtime-event-store.service';
import { RealtimeUiSyncService } from './core/services/realtime-ui-sync.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet></router-outlet>`
})
export class AppComponent implements OnInit {

  private readonly authStore =
    inject(AuthStoreService);

  private readonly authService =
    inject(AuthService);

  private readonly rateLimitStore =
    inject(RateLimitStoreService);

  private readonly sessionEvents =
    inject(SessionEventsService);

  private readonly realtimeEvents =
    inject(RealtimeEventStoreService);

  private readonly realtimeUiSync =
    inject(RealtimeUiSyncService);

  private readonly destroyRef =
    inject(DestroyRef);

  ngOnInit(): void {

    this.sessionEvents.expired$
      .pipe(
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() =>
        this.authService.logout()
      );

    if (
      this.authStore.token() &&
      !this.authStore.isAuthenticated()
    ) {
      this.authStore.clear();
    }

    if (this.authStore.isAuthenticated()) {
      this.authService
        .loadCurrentUser()
        .subscribe({
          error: () => {
            this.authStore.setUser(null);
          }
        });

      this.rateLimitStore.refreshNow();
      this.realtimeEvents.connect();
      this.realtimeUiSync.start();
    }
  }
}
