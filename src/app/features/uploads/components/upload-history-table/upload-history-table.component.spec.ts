import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { UploadHistoryTableComponent } from './upload-history-table.component';
import { UploadResponseModel } from '../../../../core/models/upload/upload-response.model';
import { UploadStatus } from '../../../../core/models/upload/upload-status.enum';

describe('UploadHistoryTableComponent', () => {
  let component: UploadHistoryTableComponent;
  let fixture: ComponentFixture<UploadHistoryTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UploadHistoryTableComponent],
      providers: [
        provideHttpClient(),
        provideRouter([])
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UploadHistoryTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('opens a custom confirmation before deleting an upload', () => {
    const upload =
      createUpload();

    component.deleteUpload(upload);
    fixture.detectChanges();

    const dialog =
      fixture.nativeElement.querySelector('[role="dialog"]');

    expect(component.pendingDeleteUpload()).toEqual(upload);
    expect(dialog).not.toBeNull();
    expect(dialog.textContent).toContain('Delete upload?');
    expect(dialog.textContent).toContain(upload.fileName);
  });

  it('cancels the delete confirmation without deleting', () => {
    const upload =
      createUpload();
    const deleteSpy =
      spyOn(component.uploadStore, 'deleteUpload');

    component.deleteUpload(upload);
    component.cancelDeleteUpload();
    fixture.detectChanges();

    expect(component.pendingDeleteUpload()).toBeNull();
    expect(deleteSpy).not.toHaveBeenCalled();
    expect(
      fixture.nativeElement.querySelector('[role="dialog"]')
    ).toBeNull();
  });

  it('deletes only after the confirmation action is accepted', () => {
    const upload =
      createUpload();
    const deleteSpy =
      spyOn(component.uploadStore, 'deleteUpload');

    component.deleteUpload(upload);
    component.confirmDeleteUpload();

    expect(deleteSpy).toHaveBeenCalledOnceWith(upload.uploadId);
    expect(component.pendingDeleteUpload()).toBeNull();
  });
});

function createUpload(): UploadResponseModel {
  return {
    uploadId: 'upload-1',
    fileName: 'sample.log',
    fileSize: 2048,
    fileSizeFormatted: '2 KB',
    status: UploadStatus.COMPLETED,
    uploadTime: '2026-06-16T10:00:00',
    message: 'Upload complete',
    totalLogs: 10,
    errorCount: 1,
    warnCount: 2
  };
}
