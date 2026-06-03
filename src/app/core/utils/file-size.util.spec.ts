import {
  formatFileSize
} from './file-size.util';

describe('formatFileSize', () => {

  it('uses backend formatted size when present', () => {

    expect(
      formatFileSize(
        2048,
        '2 KB'
      )
    ).toBe('2 KB');
  });

  it('formats bytes', () => {

    expect(
      formatFileSize(512)
    ).toBe('512 B');
  });

  it('formats kilobytes', () => {

    expect(
      formatFileSize(2048)
    ).toBe('2 KB');
  });

  it('formats megabytes', () => {

    expect(
      formatFileSize(1572864)
    ).toBe('1.5 MB');
  });

  it('formats gigabytes', () => {

    expect(
      formatFileSize(3221225472)
    ).toBe('3 GB');
  });
});
