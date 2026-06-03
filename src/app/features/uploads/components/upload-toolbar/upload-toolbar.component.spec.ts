import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadToolbarComponent } from './upload-toolbar.component';

describe('UploadToolbarComponent', () => {
  let component: UploadToolbarComponent;
  let fixture: ComponentFixture<UploadToolbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UploadToolbarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UploadToolbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
