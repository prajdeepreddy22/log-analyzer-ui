import {
  Injectable,
  inject
} from '@angular/core';

import {
  HttpClient
} from '@angular/common/http';

import {
  Observable
} from 'rxjs';

import { environment } from '../../../environments/environment';

import { ChatResponseModel } from '../models/chat/chat-response.model';

export interface ChatRequestModel {
  uploadId: string;
  message: string;
  sessionId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatApiService {

  private readonly http =
    inject(HttpClient);

  private readonly baseUrl =
    `${environment.apiBaseUrl}/chat`;

  sendMessage(
    request: ChatRequestModel
  ): Observable<ChatResponseModel> {

    return this.http.post<ChatResponseModel>(
      this.baseUrl,
      request
    );
  }
}
