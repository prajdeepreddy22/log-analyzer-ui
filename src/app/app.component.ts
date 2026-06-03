import {
  Component,
  OnInit,
  inject
} from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { AuthStoreService } from './core/stores/auth-store.service';
import { RateLimitStoreService } from './core/stores/rate-limit-store.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet></router-outlet>`
})
export class AppComponent implements OnInit {

  private readonly authStore =
    inject(AuthStoreService);

  private readonly rateLimitStore =
    inject(RateLimitStoreService);

  ngOnInit(): void {

    if (this.authStore.isAuthenticated()) {
      this.rateLimitStore.refreshNow();
    }
  }
}
