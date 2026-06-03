import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChatMessageBubbleComponent } from './chat-message-bubble.component';

describe('ChatMessageBubbleComponent', () => {
  let component: ChatMessageBubbleComponent;
  let fixture: ComponentFixture<ChatMessageBubbleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChatMessageBubbleComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChatMessageBubbleComponent);
    fixture.componentRef.setInput('message', {
      id: 'msg-1',
      role: 'assistant',
      content: 'Root cause detected',
      timestamp: '2026-06-02T10:00:00'
    });
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
