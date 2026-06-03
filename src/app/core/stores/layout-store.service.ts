import {
  Injectable,
  computed,
  signal
} from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LayoutStoreService {

  readonly sidebarCollapsed =
    signal(false);

  readonly mobileDrawerOpen =
    signal(false);

  readonly aiPanelOpen =
    signal(true);

  readonly shellClasses = computed(() => ({
    'sidebar-collapsed':
      this.sidebarCollapsed(),

    'mobile-drawer-open':
      this.mobileDrawerOpen(),

    'ai-panel-open':
      this.aiPanelOpen()
  }));

  toggleSidebar(): void {

    this.sidebarCollapsed.update(
      collapsed => !collapsed
    );
  }

  openMobileDrawer(): void {

    this.mobileDrawerOpen.set(true);
  }

  closeMobileDrawer(): void {

    this.mobileDrawerOpen.set(false);
  }

  toggleMobileDrawer(): void {

    this.mobileDrawerOpen.update(
      open => !open
    );
  }

  setAiPanelOpen(
    open: boolean
  ): void {

    this.aiPanelOpen.set(open);
  }
}
