import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { LogAiPanelComponent } from './log-ai-panel.component';

describe('LogAiPanelComponent', () => {
  let component: LogAiPanelComponent;
  let fixture: ComponentFixture<LogAiPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LogAiPanelComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LogAiPanelComponent);
    fixture.componentRef.setInput('uploadId', 'upload-1');
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
