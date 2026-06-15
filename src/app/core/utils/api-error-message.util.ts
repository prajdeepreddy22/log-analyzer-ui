import { HttpErrorResponse } from '@angular/common/http';

export function getApiErrorMessage(
  error: HttpErrorResponse
): string {

  const backendMessage =
    firstMessage(
      error.error?.details,
      error.error?.errorMessage,
      error.error?.error_message,
      error.error?.message
    );

  switch (error.status) {

    case 0:
      return 'Backend is unreachable. Check the API server and network connection.';

    case 400:
      return backendMessage || 'The request was invalid.';

    case 401:
      return backendMessage ||
        'Your session expired. Please log in again.';

    case 403:
      return backendMessage ||
        'You do not have permission to perform this action.';

    case 404:
      return backendMessage || 'The requested resource was not found.';

    case 409:
      return backendMessage ||
        'This username or email is already in use.';

    case 413:
      return backendMessage ||
        'The selected file exceeds the 10 MB upload limit.';

    case 429:
      return backendMessage || 'Rate limit exceeded. Please wait and try again.';

    case 500:
      return backendMessage ||
        'Server error. Please try again after a moment.';

    case 502:
    case 503:
      return backendMessage ||
        'The AI service or backend is temporarily unavailable. Please try again shortly.';

    default:
      return backendMessage ||
        'Something went wrong. Please try again.';
  }
}

function firstMessage(
  ...values: unknown[]
): string | null {

  for (const value of values) {
    const message =
      normalizeMessage(value);

    if (message) {
      return message;
    }
  }

  return null;
}

function normalizeMessage(
  value: unknown
): string | null {

  if (
    typeof value === 'string' &&
    value.trim()
  ) {
    const message =
      value.trim();

    if (
      /\n\s*at\s+/i.test(message) ||
      /bearer\s+[a-z0-9._-]+/i.test(message) ||
      /eyJ[a-z0-9_-]{10,}\.[a-z0-9_-]{10,}\.[a-z0-9_-]*/i.test(message)
    ) {
      return null;
    }

    return message;
  }

  if (Array.isArray(value)) {
    const messages =
      value
        .map(item => normalizeMessage(item))
        .filter(
          (item): item is string =>
            Boolean(item)
        );

    return messages.length
      ? messages.join(', ')
      : null;
  }

  if (
    value &&
    typeof value === 'object'
  ) {
    const messages =
      Object.entries(value)
        .filter(([key]) =>
          !/stack|trace|exception|token|secret|password/i.test(key)
        )
        .map(([, item]) =>
          normalizeMessage(item)
        )
        .filter(
          (item): item is string =>
            Boolean(item)
        );

    return messages.length
      ? messages.join(', ')
      : null;
  }

  return null;
}
