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

import { AnalysisResponseModel } from '../models/analysis/analysis-response.model';

import { AnalysisStatusResponseModel } from '../models/analysis/analysis-status-response.model';

@Injectable({
  providedIn: 'root'
})
export class AnalysisApiService {

  private readonly http =
    inject(HttpClient);

  private readonly baseUrl =
    `${environment.apiBaseUrl}/analysis`;

  // =========================
  // TRIGGER ANALYSIS
  // =========================

  triggerAnalysis(
    uploadId: string,
    force = false
  ): Observable<AnalysisResponseModel | null> {

    return this.http.post<AnalysisResponseModel | null>(
      `${this.baseUrl}/${uploadId}?force=${force}`,
      {}
    );
  }

  // =========================
  // GET ANALYSIS
  // =========================

  getAnalysis(
    uploadId: string
  ): Observable<AnalysisResponseModel> {

    return this.http.get<AnalysisResponseModel>(
      `${this.baseUrl}/${uploadId}`
    );
  }

  // =========================
  // GET STATUS
  // =========================

  getStatus(
    uploadId: string
  ): Observable<AnalysisStatusResponseModel> {

    return this.http.get<AnalysisStatusResponseModel>(
      `${this.baseUrl}/${uploadId}/status`
    );
  }

  getHistory(): Observable<AnalysisResponseModel[]> {

    return this.http.get<AnalysisResponseModel[]>(
      `${this.baseUrl}/history`
    );
  }
}
