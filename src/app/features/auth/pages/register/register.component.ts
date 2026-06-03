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
  Router,
  RouterLink
} from '@angular/router';

import {
  finalize
} from 'rxjs/operators';

import { AuthService } from '../../../../core/services/auth.service';
import { getApiErrorMessage } from '../../../../core/utils/api-error-message.util';

@Component({
  selector: 'app-register',

  standalone: true,

  imports: [
    CommonModule,
    RouterLink
  ],

  templateUrl: './register.component.html',

  styleUrls: ['./register.component.scss'],

  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class RegisterComponent {

  private readonly authService =
    inject(AuthService);

  private readonly router =
    inject(Router);

  readonly loading =
    signal(false);

  readonly successMessage =
    signal<string | null>(null);

  readonly errorMessage =
    signal<string | null>(null);

  readonly username =
    signal('');

  readonly email =
    signal('');

  readonly password =
    signal('');

  readonly confirmPassword =
    signal('');

  readonly submitted =
    signal(false);

  readonly usernameInvalid =
    signal(false);

  readonly emailInvalid =
    signal(false);

  readonly passwordInvalid =
    signal(false);

  readonly confirmPasswordInvalid =
    signal(false);

  readonly passwordsMismatch =
    signal(false);

  onSubmit(): void {

    this.successMessage.set(null);
    this.errorMessage.set(null);
    this.submitted.set(true);

    const username =
      this.username().trim();

    const email =
      this.email().trim();

    const password =
      this.password();

    const confirmPassword =
      this.confirmPassword();

    this.usernameInvalid.set(
      username.length < 3
    );

    this.emailInvalid.set(
      !this.isValidEmail(email)
    );

    this.passwordInvalid.set(
      password.length < 6
    );

    this.confirmPasswordInvalid.set(
      !confirmPassword
    );

    this.passwordsMismatch.set(
      Boolean(confirmPassword) &&
      password !== confirmPassword
    );

    if (
      this.usernameInvalid() ||
      this.emailInvalid() ||
      this.passwordInvalid() ||
      this.confirmPasswordInvalid() ||
      this.passwordsMismatch()
    ) {
      return;
    }

    this.loading.set(true);

    this.authService
      .register({
        username,
        email,
        password
      })
      .pipe(
        finalize(() =>
          this.loading.set(false)
        )
      )
      .subscribe({

        next: () => {

          this.successMessage.set(
            'Registration successful. Redirecting...'
          );

          window.setTimeout(() => {
            this.router.navigate(['/dashboard']);
          }, 1200);
        },

        error: err => {

          console.error(
            'Registration failed',
            err
          );

          this.errorMessage.set(
            getApiErrorMessage(err)
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
        value.trim().length < 3
      );
    }
  }

  updateEmail(
    event: Event
  ): void {

    const value =
      (event.target as HTMLInputElement).value;

    this.email.set(value);

    if (this.submitted()) {
      this.emailInvalid.set(
        !this.isValidEmail(value.trim())
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

      this.passwordsMismatch.set(
        Boolean(this.confirmPassword()) &&
        value !== this.confirmPassword()
      );
    }
  }

  updateConfirmPassword(
    event: Event
  ): void {

    const value =
      (event.target as HTMLInputElement).value;

    this.confirmPassword.set(value);

    if (this.submitted()) {
      this.confirmPasswordInvalid.set(!value);

      this.passwordsMismatch.set(
        Boolean(value) &&
        this.password() !== value
      );
    }
  }

  private isValidEmail(
    email: string
  ): boolean {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      email
    );
  }
}
