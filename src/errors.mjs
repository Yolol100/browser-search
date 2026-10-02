export class SearchError extends Error {
  constructor(code, message, status = 502, details = {}) {
    super(message);
    this.name = 'SearchError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export function publicError(error) {
  if (error instanceof SearchError) {
    return { error: { code: error.code, message: error.message, details: error.details } };
  }
  return { error: { code: 'INTERNAL_ERROR', message: 'Unexpected search-service error.' } };
}
