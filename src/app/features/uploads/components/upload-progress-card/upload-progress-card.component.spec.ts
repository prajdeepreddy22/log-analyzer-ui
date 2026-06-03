import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadProgressCardComponent } from './upload-progress-card.component';

describe('UploadProgressCardComponent', () => {
  let component: UploadProgressCardComponent;
  let fixture: ComponentFixture<UploadProgressCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UploadProgressCardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UploadProgressCardComponent);
    fixture.componentRef.setInput('fileName', 'sample.log');
    fixture.componentRef.setInput('progress', 42);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
