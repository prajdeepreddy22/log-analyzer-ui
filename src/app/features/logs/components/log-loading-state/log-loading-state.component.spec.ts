import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LogLoadingStateComponent } from './log-loading-state.component';

describe('LogLoadingStateComponent', () => {
  let component: LogLoadingStateComponent;
  let fixture: ComponentFixture<LogLoadingStateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LogLoadingStateComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LogLoadingStateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
