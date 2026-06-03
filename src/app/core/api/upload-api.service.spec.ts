import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { UploadApiService } from './upload-api.service';

describe('UploadApiService', () => {
  let service: UploadApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient()]
    });
    service = TestBed.inject(UploadApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
