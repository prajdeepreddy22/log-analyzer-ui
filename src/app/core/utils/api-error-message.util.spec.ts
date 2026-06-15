import {
  HttpErrorResponse
} from '@angular/common/http';

import {
  getApiErrorMessage
} from './api-error-message.util';

describe('getApiErrorMessage', () => {
  [
    {
      status: 400,
      expected: 'The request was invalid.'
    },
    {
      status: 401,
      expected: 'Your session expired. Please log in again.'
    },
    {
      status: 403,
      expected: 'You do not have permission to perform this action.'
    },
    {
      status: 404,
      expected: 'The requested resource was not found.'
    },
    {
      status: 409,
      expected: 'This username or email is already in use.'
    },
    {
      status: 429,
      expected: 'Rate limit exceeded. Please wait and try again.'
    },
    {
      status: 500,
      expected: 'Server error. Please try again after a moment.'
    },
    {
      status: 502,
      expected: 'The AI service or backend is temporarily unavailable. Please try again shortly.'
    },
    {
      status: 503,
      expected: 'The AI service or backend is temporarily unavailable. Please try again shortly.'
    },
    {
      status: 0,
      expected: 'Backend is unreachable. Check the API server and network connection.'
    }
  ].forEach(testCase => {
    it(`returns a user-facing message for ${testCase.status}`, () => {
      const error =
        new HttpErrorResponse({
          status: testCase.status
        });

      expect(
        getApiErrorMessage(error)
      ).toBe(testCase.expected);
    });
  });

  [
    'message',
    'details',
    'errorMessage',
    'error_message'
  ].forEach(field => {
    it(`displays backend ${field}`, () => {
      const error =
        new HttpErrorResponse({
          status: 400,
          error: {
            [field]: `${field} text`
          }
        });

      expect(
        getApiErrorMessage(error)
      ).toBe(`${field} text`);
    });
  });

  it('formats object validation details', () => {
    const error =
      new HttpErrorResponse({
        status: 400,
        error: {
          details: {
            file: 'File is too large',
            type: 'Unsupported extension'
          }
        }
      });

    expect(
      getApiErrorMessage(error)
    ).toBe(
      'File is too large, Unsupported extension'
    );
  });

  it('uses the backend error-field priority', () => {
    const error =
      new HttpErrorResponse({
        status: 400,
        error: {
          message: 'Message text',
          error_message: 'Snake-case text',
          errorMessage: 'Camel-case text',
          details: 'Details text'
        }
      });

    expect(
      getApiErrorMessage(error)
    ).toBe('Details text');
  });

  it('returns a useful 413 upload error', () => {
    const error =
      new HttpErrorResponse({
        status: 413
      });

    expect(
      getApiErrorMessage(error)
    ).toBe(
      'The selected file exceeds the 10 MB upload limit.'
    );
  });

  it('does not expose stack traces or tokens', () => {
    const error =
      new HttpErrorResponse({
        status: 500,
        error: {
          details: {
            stackTrace:
              'java.lang.Exception\n at internal.Service.run(Service.java:1)',
            token:
              'eyJabcdefghij.eyJabcdefghij.signature'
          }
        }
      });

    expect(
      getApiErrorMessage(error)
    ).toBe(
      'Server error. Please try again after a moment.'
    );
  });

  it('does not display raw proxy or framework response text', () => {
    const error =
      new HttpErrorResponse({
        status: 503,
        error:
          '<html><body>upstream connection failed</body></html>'
      });

    expect(
      getApiErrorMessage(error)
    ).toBe(
      'The AI service or backend is temporarily unavailable. Please try again shortly.'
    );
  });
});
