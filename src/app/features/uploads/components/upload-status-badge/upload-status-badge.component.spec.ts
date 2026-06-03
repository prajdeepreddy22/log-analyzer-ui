import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadStatusBadgeComponent } from './upload-status-badge.component';
import { UploadStatus } from '../../../../core/models/upload/upload-status.enum';

describe('UploadStatusBadgeComponent', () => {
  let component: UploadStatusBadgeComponent;
  let fixture: ComponentFixture<UploadStatusBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UploadStatusBadgeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UploadStatusBadgeComponent);
    fixture.componentRef.setInput(
      'status',
      UploadStatus.COMPLETED
    );
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
