import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { ApiTokensPageComponent } from './api-tokens-page.component';

describe('ApiTokensPageComponent', () => {
  let fixture: ComponentFixture<ApiTokensPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApiTokensPageComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ApiTokensPageComponent);
  });

  it('creates the page', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
