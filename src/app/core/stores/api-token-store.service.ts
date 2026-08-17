import {
  Injectable,
  computed,
  inject,
  signal
} from '@angular/core';

import {
  finalize
} from 'rxjs/operators';

import { HttpErrorResponse } from '@angular/common/http';
import { ApiTokenApiService } from '../api/api-token-api.service';
import { ApiTokenModel } from '../models/settings/api-token.model';
import { getApiErrorMessage } from '../utils/api-error-message.util';

@Injectable({
  providedIn: 'root'
})
export class ApiTokenStoreService {

  private readonly apiTokenApi =
    inject(ApiTokenApiService);

  readonly tokens =
    signal<ApiTokenModel[]>([]);

  readonly createdToken =
    signal<ApiTokenModel | null>(null);

  readonly loading =
    signal(false);

  readonly creating =
    signal(false);

  readonly revokingId =
    signal<number | null>(null);

  readonly error =
    signal<string | null>(null);

  readonly success =
    signal<string | null>(null);

  readonly activeTokens = computed(() =>
    this.tokens().filter(token => !token.revoked)
  );

  readonly revokedTokens = computed(() =>
    this.tokens().filter(token => token.revoked)
  );

  readonly hasTokens = computed(() =>
    this.tokens().length > 0
  );

  loadTokens(): void {

    this.loading.set(true);
    this.error.set(null);

    this.apiTokenApi
      .getTokens()
      .pipe(
        finalize(() =>
          this.loading.set(false)
        )
      )
      .subscribe({

        next: tokens => {
          this.tokens.set(tokens);
        },

        error: error => {
          this.error.set(
            this.errorMessage(
              error,
              'Failed to load API tokens.'
            )
          );
        }
      });
  }

  createToken(
    name: string
  ): void {

    const normalizedName =
      name.trim();

    this.creating.set(true);
    this.error.set(null);
    this.success.set(null);
    this.createdToken.set(null);

    this.apiTokenApi
      .createToken({
        name: normalizedName || null
      })
      .pipe(
        finalize(() =>
          this.creating.set(false)
        )
      )
      .subscribe({

        next: token => {
          this.createdToken.set(token);
          this.success.set(
            token.message ||
              'Token created. Copy it now.'
          );
          this.tokens.update(tokens => [
            {
              ...token,
              token: null
            },
            ...tokens
          ]);
        },

        error: error => {
          this.error.set(
            this.errorMessage(
              error,
              'Failed to create API token.'
            )
          );
        }
      });
  }

  revokeToken(
    tokenId: number
  ): void {

    this.revokingId.set(tokenId);
    this.error.set(null);
    this.success.set(null);

    this.apiTokenApi
      .revokeToken(tokenId)
      .pipe(
        finalize(() =>
          this.revokingId.set(null)
        )
      )
      .subscribe({

        next: response => {
          this.tokens.update(tokens =>
            tokens.map(token =>
              token.id === tokenId
                ? {
                    ...token,
                    revoked: true
                  }
                : token
            )
          );

          this.success.set(
            response.message ||
              'Token revoked successfully.'
          );
        },

        error: error => {
          this.error.set(
            this.errorMessage(
              error,
              'Failed to revoke API token.'
            )
          );
        }
      });
  }

  clearCreatedToken(): void {

    this.createdToken.set(null);
  }

  clearMessages(): void {

    this.error.set(null);
    this.success.set(null);
  }

  reset(): void {

    this.tokens.set([]);
    this.createdToken.set(null);
    this.loading.set(false);
    this.creating.set(false);
    this.revokingId.set(null);
    this.error.set(null);
    this.success.set(null);
  }

  private errorMessage(
    error: unknown,
    fallback: string
  ): string {

    return error instanceof HttpErrorResponse
      ? getApiErrorMessage(error)
      : fallback;
  }
}
