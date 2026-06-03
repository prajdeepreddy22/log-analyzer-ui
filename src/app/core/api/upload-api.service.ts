import { Injectable, inject } from '@angular/core';

import {
  HttpClient,
  HttpEvent,
  HttpParams
} from '@angular/common/http';

import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

import { UploadResponseModel } from '../models/upload/upload-response.model';
import { UploadStatusResponseModel } from '../models/upload/upload-status-response.model';
import { UploadPageResponseModel } from '../models/upload/upload-page-response.model';

@Injectable({
  providedIn: 'root'
})
export class UploadApiService {

  private readonly http = inject(HttpClient);

  private readonly baseUrl =
    `${environment.apiBaseUrl}/uploads`;

  uploadFile(
    file: File
  ): Observable<HttpEvent<UploadResponseModel>> {

    const formData = new FormData();

    formData.append('file', file);

    return this.http.post<UploadResponseModel>(
      this.baseUrl,
      formData,
      {
        reportProgress: true,
        observe: 'events'
      }
    );
  }

  getUploads(
    page = 0,
    size = 10,
    status?: string
  ): Observable<UploadPageResponseModel> {

    let params = new HttpParams()
      .set('page', page)
      .set('size', size);

    if (status) {
      params = params.set('status', status);
    }

    return this.http.get<UploadPageResponseModel>(
      this.baseUrl,
      { params }
    );
  }

  getUploadStatus(
    uploadId: string
  ): Observable<UploadStatusResponseModel> {

    return this.http.get<UploadStatusResponseModel>(
      `${this.baseUrl}/${uploadId}`
    );
  }

  deleteUpload(
    uploadId: string
  ): Observable<void> {

    return this.http.delete<void>(
      `${this.baseUrl}/${uploadId}`
    );
  }
}
