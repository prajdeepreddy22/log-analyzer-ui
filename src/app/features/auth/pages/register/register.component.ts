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

  private readonly passwordMinLength =
    8;

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

  readonly displayName =
    signal('');

  readonly username =
    signal('');

  readonly email =
    signal('');

  readonly password =
    signal('');

  readonly confirmPassword =
    signal('');

  readonly showPassword =
    signal(false);

  readonly showConfirmPassword =
    signal(false);

  readonly submitted =
    signal(false);

  readonly displayNameInvalid =
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

    const displayName =
      this.displayName().trim();

    const username =
      this.username().trim();

    const email =
      this.email().trim();

    const password =
      this.password();

    const confirmPassword =
      this.confirmPassword();

    this.displayNameInvalid.set(
      !this.isLengthBetween(
        displayName,
        2,
        100
      )
    );

    this.usernameInvalid.set(
      !this.isLengthBetween(
        username,
        3,
        100
      )
    );

    this.emailInvalid.set(
      !this.isValidEmail(email)
    );

    this.passwordInvalid.set(
      !this.isValidPassword(password)
    );

    this.confirmPasswordInvalid.set(
      !confirmPassword
    );

    this.passwordsMismatch.set(
      Boolean(confirmPassword) &&
      password !== confirmPassword
    );

    if (
      this.displayNameInvalid() ||
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
        displayName,
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

    this.clearApiMessages();

    this.username.set(value);

    if (this.submitted()) {
      this.usernameInvalid.set(
        !this.isLengthBetween(
          value.trim(),
          3,
          100
        )
      );
    }
  }

  updateDisplayName(
    event: Event
  ): void {

    const value =
      (event.target as HTMLInputElement).value;

    this.clearApiMessages();

    this.displayName.set(value);

    if (this.submitted()) {
      this.displayNameInvalid.set(
        !this.isLengthBetween(
          value.trim(),
          2,
          100
        )
      );
    }
  }

  updateEmail(
    event: Event
  ): void {

    const value =
      (event.target as HTMLInputElement).value;

    this.clearApiMessages();

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

    this.clearApiMessages();

    this.password.set(value);

    if (this.submitted()) {
      this.passwordInvalid.set(
        !this.isValidPassword(value)
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

    this.clearApiMessages();

    this.confirmPassword.set(value);

    if (this.submitted()) {
      this.confirmPasswordInvalid.set(!value);

      this.passwordsMismatch.set(
        Boolean(value) &&
        this.password() !== value
      );
    }
  }

  togglePasswordVisibility(): void {

    this.showPassword.update(
      visible => !visible
    );
  }

  toggleConfirmPasswordVisibility(): void {

    this.showConfirmPassword.update(
      visible => !visible
    );
  }

  passwordHelpText(): string {

    return 'Use 8+ characters with uppercase, lowercase, and a special character';
  }

  private isValidEmail(
    email: string
  ): boolean {

    return /^[^\s@]+@[^\s@]+\.(com|in)$/i.test(
      email
    );
  }

  private isValidPassword(
    password: string
  ): boolean {

    return (
      password.length >=
        this.passwordMinLength &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /[^A-Za-z0-9]/.test(password)
    );
  }

  private isLengthBetween(
    value: string,
    min: number,
    max: number
  ): boolean {

    return value.length >= min &&
      value.length <= max;
  }

  private clearApiMessages(): void {

    this.errorMessage.set(null);
    this.successMessage.set(null);
  }
}
