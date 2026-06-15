import { TestBed } from '@angular/core/testing';
import {
  HttpEventType,
  provideHttpClient
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';

import { UploadApiService } from './upload-api.service';
import { environment } from '../../../environments/environment';
import { UploadStatus } from '../models/upload/upload-status.enum';

describe('UploadApiService', () => {
  let service: UploadApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(UploadApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('posts files to the singular upload endpoint', () => {
    const file =
      new File(['entry'], 'sample.log');

    service.uploadFile(file).subscribe(event => {
      if (event.type === HttpEventType.Response) {
        expect(event.status).toBe(202);
      }
    });

    const request =
      httpMock.expectOne(
        `${environment.apiBaseUrl}/upload`
      );

    expect(request.request.method).toBe('POST');
    expect(request.request.body)
      .toBeInstanceOf(FormData);

    request.flush(
      {
        uploadId: 'upload-1',
        fileName: 'sample.log',
        fileSize: 5,
        status: UploadStatus.UPLOADED,
        uploadTime: '2026-06-14T00:00:00',
        message: 'Accepted'
      },
      {
        status: 202,
        statusText: 'Accepted'
      }
    );
  });
});
