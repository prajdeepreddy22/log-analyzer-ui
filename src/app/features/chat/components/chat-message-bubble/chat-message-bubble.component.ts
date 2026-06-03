import {
  ChangeDetectionStrategy,
  Component,
  input
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import {
  ChatMessageModel
} from '../../../../core/models/chat/chat-message.model';

import { InsightChipsComponent } from '../insight-chips/insight-chips.component';

import { ReferencedLogCardComponent } from '../referenced-log-card/referenced-log-card.component';
import { MarkdownPipe } from '../../../../shared/pipes/markdown.pipe';

@Component({
  selector: 'app-chat-message-bubble',

  standalone: true,

  imports: [
    CommonModule,
    InsightChipsComponent,
    ReferencedLogCardComponent,
    MarkdownPipe
  ],

  templateUrl:
    './chat-message-bubble.component.html',

  styleUrls:
    ['./chat-message-bubble.component.scss'],

  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class ChatMessageBubbleComponent {

  readonly message =
    input.required<ChatMessageModel>();

  readonly uploadId =
    input<string>('');

  isAssistant(): boolean {

    return (
      this.message().role ===
      'assistant'
    );
  }
}
