import {
  Component,
  inject
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { LayoutStoreService } from '../../../core/stores/layout-store.service';
import { RealtimeEventStoreService } from '../../../core/stores/realtime-event-store.service';
import { RealtimeUiSyncService } from '../../../core/services/realtime-ui-sync.service';

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

  readonly realtimeEvents =
    inject(RealtimeEventStoreService);

  readonly realtimeUiSync =
    inject(RealtimeUiSyncService);
}
