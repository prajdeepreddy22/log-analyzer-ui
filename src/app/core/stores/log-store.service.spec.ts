import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { LogStoreService } from './log-store.service';

describe('LogStoreService', () => {
  let service: LogStoreService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient()]
    });
    service = TestBed.inject(LogStoreService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
