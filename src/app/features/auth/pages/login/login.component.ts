import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import {
  ActivatedRoute,
  Router,
  RouterLink
} from '@angular/router';

import {
  finalize
} from 'rxjs/operators';

import { AuthService } from '../../../../core/services/auth.service';
import { getApiErrorMessage } from '../../../../core/utils/api-error-message.util';

@Component({
  selector: 'app-login',

  standalone: true,

  imports: [
    CommonModule,
    RouterLink
  ],

  templateUrl: './login.component.html',

  styleUrls: ['./login.component.scss'],

  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent {

  private readonly authService = inject(AuthService);

  private readonly router = inject(Router);

  private readonly route = inject(ActivatedRoute);

  readonly loading = signal(false);

  readonly errorMessage =
    signal<string | null>(null);

  readonly username =
    signal('');

  readonly password =
    signal('');

  readonly submitted =
    signal(false);

  readonly usernameInvalid =
    signal(false);

  readonly passwordInvalid =
    signal(false);

  // =====================================================
  // SUBMIT
  // =====================================================

  onSubmit(): void {

    this.errorMessage.set(null);
    this.submitted.set(true);

    const username =
      this.username().trim();

    const password =
      this.password();

    this.usernameInvalid.set(!username);

    this.passwordInvalid.set(
      password.length < 6
    );

    if (
      this.usernameInvalid() ||
      this.passwordInvalid()
    ) {

      return;
    }

    this.loading.set(true);

    this.authService.login(
      {
        username,
        password
      }
    )
    .pipe(
      finalize(() => {
        this.loading.set(false);
      })
    )
    .subscribe({

      next: () => {

        const returnUrl =
          this.route.snapshot.queryParamMap.get(
            'returnUrl'
          );

        if (
          returnUrl &&
          returnUrl.startsWith('/') &&
          !returnUrl.startsWith('//')
        ) {
          this.router.navigateByUrl(returnUrl);
          return;
        }

        this.router.navigate(['/dashboard']);

      },

      error: (error) => {
        this.errorMessage.set(
          getApiErrorMessage(error)
        );

      }

    });
  }

  updateUsername(
    event: Event
  ): void {

    const value =
      (event.target as HTMLInputElement).value;

    this.username.set(value);

    if (this.submitted()) {
      this.usernameInvalid.set(
        !value.trim()
      );
    }
  }

  updatePassword(
    event: Event
  ): void {

    const value =
      (event.target as HTMLInputElement).value;

    this.password.set(value);

    if (this.submitted()) {
      this.passwordInvalid.set(
        value.length < 6
      );
    }
  }
}
