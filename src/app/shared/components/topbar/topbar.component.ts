import {
  Component,
  inject
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { AuthStoreService } from '../../../core/stores/auth-store.service';
import { LayoutStoreService } from '../../../core/stores/layout-store.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [
    RouterLink
  ],
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.scss']
})
export class TopbarComponent {

  readonly authService =
    inject(AuthService);

  readonly authStore =
    inject(AuthStoreService);

  readonly layoutStore =
    inject(LayoutStoreService);

  logout(): void {
    this.authService.logout();
  }
}
