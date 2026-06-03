import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { AppComponent } from './app.component';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideHttpClient(),
        provideRouter([])
      ]
    }).compileComponents();
  });

  it('creates the standalone shell root', () => {
    const fixture =
      TestBed.createComponent(AppComponent);

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders a router outlet', () => {
    const fixture =
      TestBed.createComponent(AppComponent);

    fixture.detectChanges();

    const compiled =
      fixture.nativeElement as HTMLElement;

    expect(
      compiled.querySelector('router-outlet')
    ).not.toBeNull();
  });
});
