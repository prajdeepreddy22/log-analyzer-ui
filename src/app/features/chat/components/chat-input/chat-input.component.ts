import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  input,
  Output,
  signal
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

@Component({
  selector: 'app-chat-input',

  standalone: true,

  imports: [
    CommonModule
  ],

  templateUrl:
    './chat-input.component.html',

  styleUrl:
    './chat-input.component.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class ChatInputComponent {

  readonly message =
    signal('');

  readonly disabled =
    input(false);

  @Output()
  readonly sendMessage =
    new EventEmitter<string>();

  submit(): void {

    const value =
      this.message().trim();

    if (
      !value ||
      this.disabled()
    ) {
      return;
    }

    this.sendMessage.emit(value);

    this.message.set('');
  }

  updateMessage(
    event: Event
  ): void {

    const value =
      (event.target as HTMLTextAreaElement).value;

    this.message.set(value);
  }
}
