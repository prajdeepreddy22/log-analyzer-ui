import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { UploadStoreService } from './upload-store.service';

describe('UploadStoreService', () => {
  let service: UploadStoreService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient()]
    });
    service = TestBed.inject(UploadStoreService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
