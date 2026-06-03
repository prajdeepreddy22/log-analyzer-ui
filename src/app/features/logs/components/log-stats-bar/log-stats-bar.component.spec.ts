import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { LogStatsBarComponent } from './log-stats-bar.component';

describe('LogStatsBarComponent', () => {
  let component: LogStatsBarComponent;
  let fixture: ComponentFixture<LogStatsBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LogStatsBarComponent],
      providers: [
        provideHttpClient()
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LogStatsBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
