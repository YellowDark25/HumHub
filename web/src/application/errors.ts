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

/**
 * Diz se o erro é uma falha temporária do servidor (5xx).
 * Lê o status do ApplicationError; 500/502/503/504 entram, 401/403/404 não.
 * @returns true quando vale repetir a chamada ao HumHub.
 */
export function isTransientServerError(error: unknown): boolean {
  const status = errorStatus(error);
  return (
    status === 500 || status === 502 || status === 503 || status === 504
  );
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
