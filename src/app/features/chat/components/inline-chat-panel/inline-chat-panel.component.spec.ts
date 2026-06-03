import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { InlineChatPanelComponent } from './inline-chat-panel.component';

describe('InlineChatPanelComponent', () => {
  let component: InlineChatPanelComponent;
  let fixture: ComponentFixture<InlineChatPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InlineChatPanelComponent],
      providers: [
        provideHttpClient()
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InlineChatPanelComponent);
    fixture.componentRef.setInput('uploadId', 'upload-1');
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
