import {
  Component,
  inject
} from '@angular/core';
import { RouterLink } from '@angular/router';
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

  readonly layoutStore =
    inject(LayoutStoreService);
}
