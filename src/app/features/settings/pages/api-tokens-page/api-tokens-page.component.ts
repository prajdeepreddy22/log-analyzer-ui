import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import {
  FormsModule
} from '@angular/forms';

import { ApiTokenStoreService } from '../../../../core/stores/api-token-store.service';
import { ApiTokenModel } from '../../../../core/models/settings/api-token.model';

@Component({
  selector: 'app-api-tokens-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './api-tokens-page.component.html',
  styleUrl: './api-tokens-page.component.scss',
  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class ApiTokensPageComponent implements OnInit {

  readonly tokenStore =
    inject(ApiTokenStoreService);

  readonly tokenName =
    signal('');

  readonly copyState =
    signal<string | null>(null);

  ngOnInit(): void {

    this.tokenStore.loadTokens();
  }

  updateTokenName(
    value: string
  ): void {

    this.tokenName.set(value);
    this.copyState.set(null);
    this.tokenStore.clearMessages();
  }

  createToken(): void {

    this.copyState.set(null);
    this.tokenStore.createToken(
      this.tokenName()
    );
    this.tokenName.set('');
  }

  revokeToken(
    token: ApiTokenModel
  ): void {

    if (token.revoked) {
      return;
    }

    this.tokenStore.revokeToken(token.id);
  }

  async copyToken(): Promise<void> {

    const token =
      this.tokenStore.createdToken()?.token;

    if (!token) {
      return;
    }

    try {
      await navigator.clipboard.writeText(token);
      this.copyState.set('Copied to clipboard.');
    } catch {
      this.copyState.set('Select and copy the token manually.');
    }
  }

  dismissCreatedToken(): void {

    this.copyState.set(null);
    this.tokenStore.clearCreatedToken();
  }

  formatDate(
    value?: string | null
  ): string {

    if (!value) {
      return 'Never';
    }

    return new Intl.DateTimeFormat(
      undefined,
      {
        dateStyle: 'medium',
        timeStyle: 'short'
      }
    ).format(new Date(value));
  }
}
