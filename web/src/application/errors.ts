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
  return errorStatus(error) === 401;
}

export function isForbidden(error: unknown): boolean {
  return errorStatus(error) === 403;
}

export function isNotFound(error: unknown): boolean {
  return errorStatus(error) === 404;
}

function errorStatus(error: unknown): number | null {
  if (typeof error !== "object" || error === null || !("status" in error)) {
    return null;
  }

  return typeof error.status === "number" ? error.status : null;
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
