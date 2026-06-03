import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReferencedLogCardComponent } from './referenced-log-card.component';
import { provideRouter } from '@angular/router';

describe('ReferencedLogCardComponent', () => {
  let component: ReferencedLogCardComponent;
  let fixture: ComponentFixture<ReferencedLogCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReferencedLogCardComponent],
      providers: [
        provideRouter([])
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReferencedLogCardComponent);
    fixture.componentRef.setInput('log', {
      id: 1,
      timestamp: '2026-06-02T10:00:00',
      level: 'ERROR',
      message: 'Connection timeout'
    });
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
