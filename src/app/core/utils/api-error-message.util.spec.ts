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
      status: 429,
      expected: 'Rate limit exceeded. Please wait and try again.'
    },
    {
      status: 500,
      expected: 'Server error. Please try again after a moment.'
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
});
