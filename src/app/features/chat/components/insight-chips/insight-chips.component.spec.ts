import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InsightChipsComponent } from './insight-chips.component';

describe('InsightChipsComponent', () => {
  let component: InsightChipsComponent;
  let fixture: ComponentFixture<InsightChipsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InsightChipsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InsightChipsComponent);
    fixture.componentRef.setInput('insights', [
      'Detected timeout'
    ]);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
