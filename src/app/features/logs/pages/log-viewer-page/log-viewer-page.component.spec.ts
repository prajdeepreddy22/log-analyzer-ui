import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { LogViewerPageComponent } from './log-viewer-page.component';

describe('LogViewerPageComponent', () => {
  let component: LogViewerPageComponent;
  let fixture: ComponentFixture<LogViewerPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LogViewerPageComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LogViewerPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
