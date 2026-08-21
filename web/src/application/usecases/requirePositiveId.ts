import { ApplicationError } from "../errors";

export function requirePositiveId(id: number, message: string) {
  if (!Number.isFinite(id) || id <= 0) {
    throw new ApplicationError(message, 400);
  }

  return id;
}
