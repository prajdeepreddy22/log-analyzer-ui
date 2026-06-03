import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LogEmptyStateComponent } from './log-empty-state.component';

describe('LogEmptyStateComponent', () => {
  let component: LogEmptyStateComponent;
  let fixture: ComponentFixture<LogEmptyStateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LogEmptyStateComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LogEmptyStateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
