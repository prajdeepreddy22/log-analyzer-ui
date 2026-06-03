import {
  Component,
  inject
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthStoreService } from '../../../core/stores/auth-store.service';
import { LayoutStoreService } from '../../../core/stores/layout-store.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {

  readonly authStore =
    inject(AuthStoreService);

  readonly layoutStore =
    inject(LayoutStoreService);
}
