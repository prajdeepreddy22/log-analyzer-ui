import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { LogTableComponent } from './log-table.component';

describe('LogTableComponent', () => {
  let component: LogTableComponent;
  let fixture: ComponentFixture<LogTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LogTableComponent],
      providers: [
        provideHttpClient(),
        provideRouter([])
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LogTableComponent);
    fixture.componentRef.setInput('uploadId', 'upload-1');
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
