import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { LogFiltersComponent } from './log-filters.component';

describe('LogFiltersComponent', () => {
  let component: LogFiltersComponent;
  let fixture: ComponentFixture<LogFiltersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LogFiltersComponent],
      providers: [
        provideHttpClient(),
        provideRouter([])
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LogFiltersComponent);
    fixture.componentRef.setInput('uploadId', 'upload-1');
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
