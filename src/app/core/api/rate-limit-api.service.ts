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
import { RateLimitStatusModel } from '../models/rate-limit/rate-limit-status.model';

@Injectable({
  providedIn: 'root'
})
export class RateLimitApiService {

  private readonly http =
    inject(HttpClient);

  private readonly baseUrl =
    `${environment.apiBaseUrl}/rate-limit`;

  getStatus(): Observable<RateLimitStatusModel> {

    return this.http.get<RateLimitStatusModel>(
      `${this.baseUrl}/status`
    );
  }
}
