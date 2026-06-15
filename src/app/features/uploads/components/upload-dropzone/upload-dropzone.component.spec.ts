import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { UploadDropzoneComponent } from './upload-dropzone.component';
import { UploadStoreService } from '../../../../core/stores/upload-store.service';

describe('UploadDropzoneComponent', () => {
  let component: UploadDropzoneComponent;
  let fixture: ComponentFixture<UploadDropzoneComponent>;
  let uploadStore:
    jasmine.SpyObj<UploadStoreService>;

  beforeEach(async () => {
    uploadStore =
      jasmine.createSpyObj<UploadStoreService>(
        'UploadStoreService',
        ['uploadFile']
      );

    await TestBed.configureTestingModule({
      imports: [UploadDropzoneComponent],
      providers: [
        provideHttpClient(),
        {
          provide: UploadStoreService,
          useValue: uploadStore
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UploadDropzoneComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('accepts .log and .txt extensions case-insensitively', () => {
    handleFile(
      new File(
        ['log'],
        'APPLICATION.LOG'
      )
    );

    handleFile(
      new File(
        ['log'],
        'application.TxT'
      )
    );

    expect(uploadStore.uploadFile)
      .toHaveBeenCalledTimes(2);

    expect(component.error()).toBeNull();
  });

  it('rejects files larger than 10 MB', () => {
    handleFile(
      new File(
        [new Uint8Array(
          10 * 1024 * 1024 + 1
        )],
        'oversized.log'
      )
    );

    expect(uploadStore.uploadFile)
      .not.toHaveBeenCalled();

    expect(component.error()).toBe(
      'Maximum file size is 10MB'
    );
  });

  it('rejects unsupported extensions', () => {
    handleFile(
      new File(
        ['log'],
        'application.json'
      )
    );

    expect(uploadStore.uploadFile)
      .not.toHaveBeenCalled();

    expect(component.error()).toBe(
      'Only .log and .txt files are allowed'
    );
  });

  function handleFile(
    file: File
  ): void {

    (
      component as unknown as {
        handleFile(file: File): void;
      }
    ).handleFile(file);
  }
});
