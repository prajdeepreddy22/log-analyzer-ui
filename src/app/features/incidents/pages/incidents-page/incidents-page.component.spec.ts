import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { IncidentsPageComponent } from './incidents-page.component';

describe('IncidentsPageComponent', () => {
  let fixture: ComponentFixture<IncidentsPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IncidentsPageComponent],
      providers: [
        provideHttpClient(),
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(IncidentsPageComponent);
    fixture.detectChanges();
  });

  it('creates the incidents page', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
