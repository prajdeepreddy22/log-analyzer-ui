import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import {
  ActivatedRoute
} from '@angular/router';

import { ChatStoreService } from '../../../../core/stores/chat-store.service';
import { RateLimitStoreService } from '../../../../core/stores/rate-limit-store.service';

import { UploadStoreService } from '../../../../core/stores/upload-store.service';

import { UploadApiService } from '../../../../core/api/upload-api.service';

import { ChatApiService } from '../../../../core/api/chat-api.service';

import {
  ChatStreamError,
  ChatStreamingService
} from '../../../../core/services/chat-streaming.service';

import { AuthService } from '../../../../core/services/auth.service';

import { ChatMessageListComponent } from '../../components/chat-message-list/chat-message-list.component';

import { ChatInputComponent } from '../../components/chat-input/chat-input.component';

import { ChatMessageModel } from '../../../../core/models/chat/chat-message.model';

import { UploadStatus } from '../../../../core/models/upload/upload-status.enum';

import { mergeStreamingContent } from '../../../../core/utils/streaming-content.util';

import {
  finalize,
  Subscription
} from 'rxjs';

import {
  takeUntilDestroyed
} from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-chat-page',

  standalone: true,

  imports: [
    CommonModule,
    ChatMessageListComponent,
    ChatInputComponent
  ],

  templateUrl: './chat-page.component.html',

  styleUrl: './chat-page.component.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class ChatPageComponent
  implements OnInit, OnDestroy {

  readonly chatStore =
    inject(ChatStoreService);

  readonly uploadStore =
    inject(UploadStoreService);

  private readonly rateLimitStore =
    inject(RateLimitStoreService);

  private readonly uploadApi =
    inject(UploadApiService);

  private readonly chatApi =
    inject(ChatApiService);

  private readonly chatStreaming =
    inject(ChatStreamingService);

  private readonly authService =
    inject(AuthService);

  private readonly route =
    inject(ActivatedRoute);

  private readonly destroyRef =
    inject(DestroyRef);

  readonly selectedUploadId =
    signal('');

  readonly loadingUploads =
    signal(false);

  readonly streamingEnabled =
    signal(true);

  private streamSubscription?: Subscription;

  private activeStreamingMessageId: string | null =
    null;

  private activeStreamingContent =
    '';

  private streamingRenderFrame:
    number | null = null;

  readonly selectedUpload =
    computed(() =>
      this.uploadStore.selectedUploadById(
        this.selectedUploadId()
      )
    );

  ngOnInit(): void {

    this.loadingUploads.set(true);

    this.uploadApi
      .getUploads(
        0,
        100,
        UploadStatus.COMPLETED
      )
      .pipe(
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({

        next: response => {

          this.uploadStore.setUploads(
            response.content
          );

          const requestedUploadId =
            this.route.snapshot.queryParamMap.get(
              'uploadId'
            );

          const requestedUpload =
            requestedUploadId
              ? response.content.find(upload =>
                  upload.uploadId === requestedUploadId
                )
              : null;

          const initial =
            requestedUpload ||
            this.uploadStore.selectedUpload() ||
            response.content[0];

          if (initial) {

            this.uploadStore.selectUpload(
              initial
            );

            this.selectedUploadId.set(
              initial.uploadId
            );
          }

          this.loadingUploads.set(false);
        },

        error: () => {

          this.loadingUploads.set(false);
        }
      });
  }

  ngOnDestroy(): void {

    this.stopGeneration();
  }

  clearChat(): void {

    this.stopGeneration();

    this.chatStore.clearChat();

    this.chatStore.setError(null);
  }

  selectUpload(
    uploadId: string
  ): void {

    const upload =
      this.uploadStore.selectedUploadById(
        uploadId
      );

    if (!upload) {
      return;
    }

    this.uploadStore.selectUpload(upload);

    this.selectedUploadId.set(uploadId);
  }

  sendMessage(
    message: string
  ): void {

    const uploadId =
      this.selectedUploadId();

    if (!uploadId) {

      this.chatStore.setError(
        'Select a completed upload before asking a question.'
      );

      return;
    }

    if (
      this.chatStore.busy()
    ) {
      return;
    }

    if (this.streamingEnabled()) {

      this.sendStreamingMessage(
        uploadId,
        message
      );

      return;
    }

    this.sendStandardMessage(
      uploadId,
      message
    );
  }

  stopGeneration(): void {

    if (this.streamSubscription) {
      this.streamSubscription.unsubscribe();
      this.streamSubscription = undefined;
    }

    this.cancelStreamingRender();

    if (this.activeStreamingMessageId) {

      this.chatStore.updateStreamingMessage(
        this.activeStreamingMessageId,
        this.activeStreamingContent ||
          'Generation stopped.'
      );
    }

    this.activeStreamingMessageId = null;
    this.activeStreamingContent = '';

    this.chatStore.setStreaming(false);
    this.chatStore.setLoading(false);
  }

  toggleStreaming(
    enabled: boolean
  ): void {

    this.streamingEnabled.set(enabled);
  }

  selectUploadFromEvent(
    event: Event
  ): void {

    const uploadId =
      (event.target as HTMLSelectElement).value;

    this.selectUpload(uploadId);
  }

  toggleStreamingFromEvent(
    event: Event
  ): void {

    const enabled =
      (event.target as HTMLInputElement).checked;

    this.toggleStreaming(enabled);
  }

  private sendStreamingMessage(
    uploadId: string,
    message: string
  ): void {

    this.chatStore.addUserMessage(
      message
    );

    const streamingId =
      this.chatStore.addLoadingMessage();

    this.activeStreamingMessageId =
      streamingId;

    this.activeStreamingContent =
      '';

    this.chatStore.setLoading(true);
    this.chatStore.setStreaming(true);
    this.chatStore.setError(null);

    this.streamSubscription =
      this.chatStreaming
        .stream(
          uploadId,
          message
        )
        .pipe(
          finalize(() =>
            this.rateLimitStore.refreshNow()
          )
        )
        .subscribe({

          next: chunk => {

            if (chunk.content) {
              this.activeStreamingContent =
                mergeStreamingContent(
                  this.activeStreamingContent,
                  chunk.content
                );

              this.scheduleStreamingRender(
                streamingId
              );
            }

            if (chunk.completed) {
              this.cancelStreamingRender();

              this.chatStore.updateStreamingMessage(
                streamingId,
                this.activeStreamingContent
              );

              this.activeStreamingMessageId = null;
              this.activeStreamingContent = '';

              this.chatStore.setStreaming(false);
              this.chatStore.setLoading(false);

              this.streamSubscription = undefined;
            }
          },

          error: error => {

            this.cancelStreamingRender();

            if (this.activeStreamingContent) {

              this.chatStore.updateStreamingMessage(
                streamingId,
                `${this.activeStreamingContent}\n\n[Stream interrupted. Partial response preserved.]`
              );

            } else {

              this.chatStore.removeMessage(
                streamingId
              );
            }

            this.activeStreamingMessageId = null;
            this.activeStreamingContent = '';

            this.chatStore.setStreaming(false);
            this.chatStore.setLoading(false);

            if (
              error instanceof ChatStreamError &&
              error.status === 401
            ) {
              this.authService.logout();
              return;
            }

            this.chatStore.setError(
              'Streaming chat failed. Please try again.'
            );

            this.streamSubscription = undefined;
          },

          complete: () => {

            this.chatStore.setStreaming(false);
            this.chatStore.setLoading(false);
            this.streamSubscription = undefined;
          }
        });
  }

  private sendStandardMessage(
    uploadId: string,
    message: string
  ): void {

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
        takeUntilDestroyed(this.destroyRef),
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

        error: () => {

          this.chatStore.removeMessage(
            loadingId
          );

          this.chatStore.setLoading(false);

          this.chatStore.setError(
            'Chat request failed. Please try again.'
          );
        }
      });
  }

  private scheduleStreamingRender(
    messageId: string
  ): void {

    if (this.streamingRenderFrame !== null) {
      return;
    }

    this.streamingRenderFrame =
      window.requestAnimationFrame(() => {

        this.streamingRenderFrame = null;

        this.chatStore.updateStreamingMessage(
          messageId,
          this.activeStreamingContent
        );
      });
  }

  private cancelStreamingRender(): void {

    if (this.streamingRenderFrame === null) {
      return;
    }

    window.cancelAnimationFrame(
      this.streamingRenderFrame
    );

    this.streamingRenderFrame = null;
  }
}
