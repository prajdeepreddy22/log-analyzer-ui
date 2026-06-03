import {
  mergeStreamingContent
} from './streaming-content.util';

describe('mergeStreamingContent', () => {

  it('appends delta chunks preserving whitespace', () => {

    expect(
      mergeStreamingContent(
        'Issues:\n',
        '- Auth failed\n'
      )
    ).toBe(
      'Issues:\n- Auth failed\n'
    );
  });

  it('replaces current text when incoming chunk is cumulative', () => {

    expect(
      mergeStreamingContent(
        'Issues:\n- Auth',
        'Issues:\n- Auth failed'
      )
    ).toBe(
      'Issues:\n- Auth failed'
    );
  });

  it('ignores repeated chunks', () => {

    expect(
      mergeStreamingContent(
        'Fix:\nRetry payment gateway',
        'Retry payment gateway'
      )
    ).toBe(
      'Fix:\nRetry payment gateway'
    );
  });

  it('merges partial overlaps', () => {

    expect(
      mergeStreamingContent(
        'Root cause: NullPointer',
        'PointerException in AuthService'
      )
    ).toBe(
      'Root cause: NullPointerException in AuthService'
    );
  });
});
