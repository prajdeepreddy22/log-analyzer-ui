import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { LogSourcesPageComponent } from './log-sources-page.component';

describe('LogSourcesPageComponent', () => {
  let fixture: ComponentFixture<LogSourcesPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LogSourcesPageComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LogSourcesPageComponent);
  });

  it('creates the page', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
