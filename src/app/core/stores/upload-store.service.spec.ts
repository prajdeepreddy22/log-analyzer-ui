import {
  fakeAsync,
  TestBed,
  tick
} from '@angular/core/testing';
import {
  NEVER,
  Subject
} from 'rxjs';

import { UploadStoreService } from './upload-store.service';
import { UploadApiService } from '../api/upload-api.service';
import { UploadStatus } from '../models/upload/upload-status.enum';

describe('UploadStoreService', () => {
  let service: UploadStoreService;
  let uploadApi:
    jasmine.SpyObj<UploadApiService>;

  beforeEach(() => {
    uploadApi =
      jasmine.createSpyObj<UploadApiService>(
        'UploadApiService',
        [
          'uploadFile',
          'getUploads',
          'getUploadStatus',
          'deleteUpload'
        ]
      );

    uploadApi.uploadFile.and.returnValue(
      NEVER
    );

    TestBed.configureTestingModule({
      providers: [
        {
          provide: UploadApiService,
          useValue: uploadApi
        }
      ]
    });
    service = TestBed.inject(UploadStoreService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('allows a file that matches an existing upload', () => {
    service.setUploads([
      {
        uploadId: 'existing-upload',
        fileName: 'sample.log',
        fileSize: 3,
        status: UploadStatus.COMPLETED,
        uploadTime: '2026-06-14T00:00:00',
        message: 'Completed'
      }
    ]);

    const file =
      new File(
        ['log'],
        'sample.log'
      );

    service.uploadFile(file);

    expect(uploadApi.uploadFile)
      .toHaveBeenCalledWith(file);
  });

  it('stops polling after COMPLETED', fakeAsync(() => {
    const statusSubject =
      new Subject<{
        uploadId: string;
        status: UploadStatus;
        totalLogs: number;
        errorCount: number;
        warnCount: number;
      }>();

    uploadApi.getUploadStatus.and.returnValue(
      statusSubject
    );

    service.pollUploadStatus('upload-1');

    statusSubject.next({
      uploadId: 'upload-1',
      status: UploadStatus.COMPLETED,
      totalLogs: 4,
      errorCount: 1,
      warnCount: 0
    });

    tick(3000);

    expect(uploadApi.getUploadStatus)
      .toHaveBeenCalledTimes(1);
  }));

  it('stores the backend failure reason and stops polling', fakeAsync(() => {
    service.setUploads([
      {
        uploadId: 'upload-2',
        fileName: 'failed.log',
        fileSize: 3,
        status: UploadStatus.PROCESSING,
        uploadTime: '2026-06-14T00:00:00',
        message: 'Processing'
      }
    ]);

    const statusSubject =
      new Subject<{
        uploadId: string;
        status: UploadStatus;
        totalLogs: number;
        errorCount: number;
        warnCount: number;
        errorMessage: string;
      }>();

    uploadApi.getUploadStatus.and.returnValue(
      statusSubject
    );

    service.pollUploadStatus('upload-2');

    statusSubject.next({
      uploadId: 'upload-2',
      status: UploadStatus.FAILED,
      totalLogs: 0,
      errorCount: 0,
      warnCount: 0,
      errorMessage: 'Log parsing failed'
    });

    tick(3000);

    expect(
      service.uploads()[0].errorMessage
    ).toBe('Log parsing failed');

    expect(uploadApi.getUploadStatus)
      .toHaveBeenCalledTimes(1);
  }));
});
