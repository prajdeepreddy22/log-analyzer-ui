import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { AnalysisApiService } from './analysis-api.service';

describe('AnalysisApiService', () => {
  let service: AnalysisApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient()]
    });
    service = TestBed.inject(AnalysisApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
