export class ApplicationError extends Error {
  constructor(
    message: string,
    public readonly status = 500,
  ) {
    super(message);
    this.name = "ApplicationError";
  }
}

export function isUnauthorized(error: unknown): boolean {
  return error instanceof ApplicationError && error.status === 401;
}

export function isForbidden(error: unknown): boolean {
  return error instanceof ApplicationError && error.status === 403;
}

export function isNotFound(error: unknown): boolean {
  return error instanceof ApplicationError && error.status === 404;
}

export function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApplicationError) {
    return error.message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
