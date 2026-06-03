import {
  Injectable,
  computed,
  signal
} from '@angular/core';

import {
  ChatMessageModel
} from '../models/chat/chat-message.model';

@Injectable({
  providedIn: 'root'
})
export class ChatStoreService {

  // =====================
  // STATE
  // =====================

  readonly messages =
    signal<ChatMessageModel[]>([]);

  readonly loading =
    signal(false);

  readonly streaming =
    signal(false);

  readonly error =
    signal<string | null>(null);

  // =====================
  // COMPUTED
  // =====================

  readonly hasMessages =
    computed(() =>
      this.messages().length > 0
    );

  readonly busy =
    computed(() =>
      this.loading() || this.streaming()
    );

  // =====================
  // ADD USER MESSAGE
  // =====================

  addUserMessage(
    content: string
  ): void {

    const message:
      ChatMessageModel = {

      id: crypto.randomUUID(),

      role: 'user',

      content,

      timestamp:
        new Date().toISOString()
    };

    this.messages.update(messages => [
      ...messages,
      message
    ]);
  }

  // =====================
  // ADD ASSISTANT MESSAGE
  // =====================

  addAssistantMessage(
    message: ChatMessageModel
  ): void {

    this.messages.update(messages => [
      ...messages,
      message
    ]);
  }

  // =====================
  // ADD LOADING MESSAGE
  // =====================

  addLoadingMessage(): string {

    const id =
      crypto.randomUUID();

    const loadingMessage:
      ChatMessageModel = {

      id,

      role: 'assistant',

      content: '',

      loading: true,

      timestamp:
        new Date().toISOString()
    };

    this.messages.update(messages => [
      ...messages,
      loadingMessage
    ]);

    return id;
  }

  // =====================
  // UPDATE STREAMING MESSAGE
  // =====================

  updateStreamingMessage(
    id: string,
    content: string
  ): void {

    this.messages.update(messages =>
      messages.map(message => {

        if (message.id !== id) {
          return message;
        }

        return {
          ...message,
          content,
          loading: false
        };
      })
    );
  }

  // =====================
  // REMOVE MESSAGE
  // =====================

  removeMessage(
    id: string
  ): void {

    this.messages.update(messages =>
      messages.filter(
        message => message.id !== id
      )
    );
  }

  // =====================
  // CLEAR CHAT
  // =====================

  clearChat(): void {

    this.messages.set([]);

    this.error.set(null);
  }

  // =====================
  // SET LOADING
  // =====================

  setLoading(
    loading: boolean
  ): void {

    this.loading.set(loading);
  }

  // =====================
  // SET STREAMING
  // =====================

  setStreaming(
    streaming: boolean
  ): void {

    this.streaming.set(streaming);
  }

  // =====================
  // SET ERROR
  // =====================

  setError(
    error: string | null
  ): void {

    this.error.set(error);
  }
}
