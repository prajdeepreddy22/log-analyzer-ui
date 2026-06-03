import {
  Injectable,
  inject
} from '@angular/core';

import {
  HttpClient,
  HttpParams
} from '@angular/common/http';

import {
  Observable
} from 'rxjs';

import { environment } from '../../../environments/environment';

import { LogPageResponseModel } from '../models/log/log-page-response.model';

import { LogSearchRequestModel } from '../models/log/log-search-request.model';

import { LogStatsResponseModel } from '../models/log/log-stats-response.model';

@Injectable({
  providedIn: 'root'
})
export class LogApiService {

  private readonly http =
    inject(HttpClient);

  private readonly baseUrl =
    `${environment.apiBaseUrl}/logs`;

  // =========================
  // GET LOGS
  // =========================

  getLogs(
    uploadId: string,
    page: number,
    size: number,
    sortBy: string,
    direction: string
  ): Observable<LogPageResponseModel> {

    const params =
      new HttpParams()

        .set('page', page)

        .set('size', size)

        .set('sortBy', sortBy)

        .set('direction', direction);

    return this.http.get<LogPageResponseModel>(
      `${this.baseUrl}/${uploadId}`,
      { params }
    );
  }

  // =========================
  // SEARCH LOGS
  // =========================

  searchLogs(
    uploadId: string,
    request: LogSearchRequestModel
  ): Observable<LogPageResponseModel> {

    return this.http.post<LogPageResponseModel>(
      `${this.baseUrl}/search/${uploadId}`,
      request
    );
  }

  // =========================
  // GET LOG STATS
  // =========================

  getLogStats(
    uploadId: string
  ): Observable<LogStatsResponseModel> {

    return this.http.get<LogStatsResponseModel>(
      `${this.baseUrl}/${uploadId}/stats`
    );
  }
}