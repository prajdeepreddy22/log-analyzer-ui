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
import { CreateLogSourceRequestModel } from '../models/settings/create-log-source-request.model';
import { LogSourceModel, LogSourceStatus } from '../models/settings/log-source.model';
import { UpdateLogSourceStatusRequestModel } from '../models/settings/update-log-source-status-request.model';

@Injectable({
  providedIn: 'root'
})
export class LogSourceApiService {

  private readonly http =
    inject(HttpClient);

  private readonly baseUrl =
    `${environment.apiBaseUrl}/log-sources`;

  getSources(): Observable<LogSourceModel[]> {

    return this.http.get<LogSourceModel[]>(
      this.baseUrl
    );
  }

  createSource(
    request: CreateLogSourceRequestModel
  ): Observable<LogSourceModel> {

    return this.http.post<LogSourceModel>(
      this.baseUrl,
      request
    );
  }

  updateStatus(
    sourceId: number,
    status: LogSourceStatus
  ): Observable<LogSourceModel> {

    const request: UpdateLogSourceStatusRequestModel = {
      status
    };

    return this.http.patch<LogSourceModel>(
      `${this.baseUrl}/${sourceId}`,
      request
    );
  }
}
