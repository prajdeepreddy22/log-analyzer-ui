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
import { ApiTokenModel } from '../models/settings/api-token.model';
import { CreateApiTokenRequestModel } from '../models/settings/create-api-token-request.model';

@Injectable({
  providedIn: 'root'
})
export class ApiTokenApiService {

  private readonly http =
    inject(HttpClient);

  private readonly baseUrl =
    `${environment.apiBaseUrl}/settings/tokens`;

  getTokens(): Observable<ApiTokenModel[]> {

    return this.http.get<ApiTokenModel[]>(
      this.baseUrl
    );
  }

  createToken(
    request: CreateApiTokenRequestModel
  ): Observable<ApiTokenModel> {

    return this.http.post<ApiTokenModel>(
      this.baseUrl,
      request
    );
  }

  revokeToken(
    tokenId: number
  ): Observable<{ message: string }> {

    return this.http.delete<{ message: string }>(
      `${this.baseUrl}/${tokenId}`
    );
  }
}
