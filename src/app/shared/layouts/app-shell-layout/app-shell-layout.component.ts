import {
  Component,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { TopbarComponent } from '../../components/topbar/topbar.component';
import { LayoutStoreService } from '../../../core/stores/layout-store.service';

@Component({
  selector: 'app-app-shell-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    SidebarComponent,
    TopbarComponent
  ],
  templateUrl: './app-shell-layout.component.html',
  styleUrls: ['./app-shell-layout.component.scss']
})
export class AppShellLayoutComponent {

  readonly layoutStore =
    inject(LayoutStoreService);
}
