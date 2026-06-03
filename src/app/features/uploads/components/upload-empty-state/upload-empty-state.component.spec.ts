import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadEmptyStateComponent } from './upload-empty-state.component';

describe('UploadEmptyStateComponent', () => {
  let component: UploadEmptyStateComponent;
  let fixture: ComponentFixture<UploadEmptyStateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UploadEmptyStateComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UploadEmptyStateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
