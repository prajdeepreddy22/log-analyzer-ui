import {
  Component,
  ElementRef,
  HostListener,
  inject,
  signal
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { AuthStoreService } from '../../../core/stores/auth-store.service';
import { AuthService } from '../../../core/services/auth.service';
import { LayoutStoreService } from '../../../core/stores/layout-store.service';
import { getApiErrorMessage } from '../../../core/utils/api-error-message.util';

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

  private readonly host =
    inject(ElementRef<HTMLElement>);

  private readonly authService =
    inject(AuthService);

  readonly authStore =
    inject(AuthStoreService);

  readonly layoutStore =
    inject(LayoutStoreService);

  readonly menuOpen =
    signal(false);

  readonly profileOpen =
    signal(false);

  readonly profileDisplayName =
    signal('');

  readonly profileInvalid =
    signal(false);

  readonly profileSaving =
    signal(false);

  readonly profileError =
    signal<string | null>(null);

  readonly profileSuccess =
    signal<string | null>(null);

  @HostListener('document:click', ['$event'])
  onDocumentClick(
    event: MouseEvent
  ): void {

    if (
      this.host.nativeElement.contains(
        event.target as Node
      )
    ) {
      return;
    }

    this.closeMenu();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {

    this.closeProfile();
    this.closeMenu();
  }

  toggleMenu(): void {

    this.menuOpen.update(open => !open);
  }

  closeMenu(): void {

    this.menuOpen.set(false);
  }

  openProfile(): void {

    this.profileDisplayName.set(
      this.authStore.displayName()
    );

    this.profileInvalid.set(false);
    this.profileError.set(null);
    this.profileSuccess.set(null);
    this.profileOpen.set(true);
    this.closeMenu();
  }

  closeProfile(): void {

    if (this.profileSaving()) {
      return;
    }

    this.profileOpen.set(false);
    this.profileError.set(null);
    this.profileSuccess.set(null);
  }

  updateProfileDisplayName(
    event: Event
  ): void {

    const value =
      (event.target as HTMLInputElement).value;

    this.profileDisplayName.set(value);
    this.profileError.set(null);
    this.profileSuccess.set(null);

    if (this.profileInvalid()) {
      this.profileInvalid.set(
        !this.isValidDisplayName(value)
      );
    }
  }

  saveProfile(): void {

    const displayName =
      this.profileDisplayName().trim();

    this.profileInvalid.set(
      !this.isValidDisplayName(displayName)
    );

    this.profileError.set(null);
    this.profileSuccess.set(null);

    if (this.profileInvalid()) {
      return;
    }

    this.profileSaving.set(true);

    this.authService
      .updateProfile(displayName)
      .pipe(
        finalize(() =>
          this.profileSaving.set(false)
        )
      )
      .subscribe({

        next: () => {
          this.profileSuccess.set(
            'Profile updated successfully.'
          );
        },

        error: error => {
          this.profileSuccess.set(null);
          this.profileError.set(
            getApiErrorMessage(error)
          );
        }
      });
  }

  logout(): void {

    this.closeProfile();
    this.closeMenu();
    this.authService.logout();
  }

  private isValidDisplayName(
    value: string
  ): boolean {

    const length =
      value.trim().length;

    return length >= 2 &&
      length <= 100;
  }
}
