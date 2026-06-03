import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  output,
  computed,
  effect,
  inject,
  input,
  viewChild
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import { ChatStoreService } from '../../../../core/stores/chat-store.service';

import { ChatMessageBubbleComponent } from '../chat-message-bubble/chat-message-bubble.component';

@Component({
  selector: 'app-chat-message-list',

  standalone: true,

  imports: [
    CommonModule,
    ChatMessageBubbleComponent
  ],

  templateUrl:
    './chat-message-list.component.html',

  styleUrl:
    './chat-message-list.component.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class ChatMessageListComponent {

  readonly chatStore =
    inject(ChatStoreService);

  readonly uploadId =
    input<string>('');

  readonly promptSelected =
    output<string>();

  readonly scrollContainer =
    viewChild<ElementRef<HTMLDivElement>>(
      'scrollContainer'
    );

  readonly messages =
    computed(() =>
      this.chatStore.messages()
    );

  constructor() {

    effect(() => {

      this.messages();

      queueMicrotask(() => {

        const element =
          this.scrollContainer()
            ?.nativeElement;

        if (!element) {
          return;
        }

        element.scrollTop =
          element.scrollHeight;
      });
    });
  }

  trackByMessage(
    index: number,
    message: any
  ): string {

    return message.id;
  }

  usePrompt(
    prompt: string
  ): void {

    this.promptSelected.emit(prompt);
  }
}
