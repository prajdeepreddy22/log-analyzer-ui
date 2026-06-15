import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import {
  ChatStoreService
} from '../../../../core/stores/chat-store.service';

import {
  RateLimitStoreService
} from '../../../../core/stores/rate-limit-store.service';

import {
  ChatMessageBubbleComponent
} from '../chat-message-bubble/chat-message-bubble.component';

import {
  ChatInputComponent
} from '../chat-input/chat-input.component';

import {
  ChatMessageModel
} from '../../../../core/models/chat/chat-message.model';

import {
  ChatApiService
} from '../../../../core/api/chat-api.service';

import {
  finalize
} from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { getApiErrorMessage } from '../../../../core/utils/api-error-message.util';

@Component({
  selector: 'app-inline-chat-panel',

  standalone: true,

  imports: [
    CommonModule,
    ChatMessageBubbleComponent,
    ChatInputComponent
  ],

  templateUrl:
    './inline-chat-panel.component.html',

  styleUrls:
    ['./inline-chat-panel.component.scss'],

  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class InlineChatPanelComponent {

  readonly uploadId =
    input.required<string>();

  readonly chatStore =
    inject(ChatStoreService);

  private readonly chatApi =
    inject(ChatApiService);

  private readonly rateLimitStore =
    inject(RateLimitStoreService);

  readonly messages =
    computed(() =>
      this.chatStore.messages()
    );

  clearChat(): void {

    this.chatStore.clearChat();
    this.chatStore.setError(null);
  }

  sendMessage(
    message: string
  ): void {

    const uploadId =
      this.uploadId();

    if (!uploadId) {
      this.chatStore.setError(
        'Upload context is missing.'
      );
      return;
    }

    if (this.chatStore.busy()) {
      return;
    }

    this.chatStore.addUserMessage(
      message
    );

    const loadingId =
      this.chatStore.addLoadingMessage();

    this.chatStore.setLoading(true);
    this.chatStore.setError(null);

    this.chatApi
      .sendMessage({
        uploadId,
        message
      })
      .pipe(
        finalize(() =>
          this.rateLimitStore.refreshNow()
        )
      )
      .subscribe({

        next: response => {

          this.chatStore.removeMessage(
            loadingId
          );

          const assistantMessage:
            ChatMessageModel = {

            id:
              crypto.randomUUID(),

            role:
              'assistant',

            content:
              response.answer,

            timestamp:
              new Date().toISOString(),

            confidence:
              response.confidence,

            quality:
              response.quality,

            source:
              response.source,

            insights:
              response.insights,

            referencedLogs:
              response.usedLogs
          };

          this.chatStore.addAssistantMessage(
            assistantMessage
          );

          this.chatStore.setLoading(false);
        },

        error: error => {

          this.chatStore.removeMessage(
            loadingId
          );

          this.chatStore.setLoading(false);

          this.chatStore.setError(
            error instanceof HttpErrorResponse
              ? getApiErrorMessage(error)
              : 'Chat request failed. Please try again.'
          );
        }
      });
  }
}
