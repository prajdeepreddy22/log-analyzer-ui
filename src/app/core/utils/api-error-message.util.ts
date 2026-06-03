import { HttpErrorResponse } from '@angular/common/http';

export function getApiErrorMessage(
  error: HttpErrorResponse
): string {

  if (typeof error.error === 'string') {
    return error.error;
  }

  const backendMessage =
    error.error?.message ||
    error.error?.error ||
    error.message;

  switch (error.status) {

    case 0:
      return 'Backend is unreachable. Check the API server and network connection.';

    case 400:
      return backendMessage || 'The request was invalid.';

    case 401:
      return 'Your session expired. Please log in again.';

    case 403:
      return 'You do not have permission to perform this action.';

    case 404:
      return backendMessage || 'The requested resource was not found.';

    case 409:
      return backendMessage || 'This action conflicts with the current resource state.';

    case 429:
      return backendMessage || 'Rate limit exceeded. Please wait and try again.';

    case 500:
      return 'Server error. Please try again after a moment.';

    default:
      return backendMessage || 'Something went wrong. Please try again.';
  }
}
