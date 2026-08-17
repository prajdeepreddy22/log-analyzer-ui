import {
  Injectable,
  inject
} from '@angular/core';

import {
  HttpClient,
  HttpParams
} from '@angular/common/http';

import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  IncidentModel,
  IncidentPageResponseModel,
  IncidentStatus,
  IncidentStatusHistoryModel
} from '../models/incident/incident.model';
import { UpdateIncidentStatusRequestModel } from '../models/incident/update-incident-status-request.model';

@Injectable({
  providedIn: 'root'
})
export class IncidentApiService {

  private readonly http =
    inject(HttpClient);

  private readonly baseUrl =
    `${environment.apiBaseUrl}/incidents`;

  getIncidents(
    status: IncidentStatus | '',
    page: number,
    size: number
  ): Observable<IncidentPageResponseModel> {

    let params =
      new HttpParams()
        .set('page', page)
        .set('size', size);

    if (status) {
      params = params.set('status', status);
    }

    return this.http.get<IncidentPageResponseModel>(
      this.baseUrl,
      { params }
    );
  }

  getIncident(
    incidentId: string
  ): Observable<IncidentModel> {

    return this.http.get<IncidentModel>(
      `${this.baseUrl}/${incidentId}`
    );
  }

  updateStatus(
    incidentId: string,
    request: UpdateIncidentStatusRequestModel
  ): Observable<IncidentModel> {

    return this.http.patch<IncidentModel>(
      `${this.baseUrl}/${incidentId}/status`,
      request
    );
  }

  getHistory(
    incidentId: string
  ): Observable<IncidentStatusHistoryModel[]> {

    return this.http.get<IncidentStatusHistoryModel[]>(
      `${this.baseUrl}/${incidentId}/history`
    );
  }
}
