import { ApplicationError } from "../errors";
import type { AuthRepository } from "../ports/AuthRepository";

export function followPerson(
  auth: AuthRepository,
  token: string,
  userId: number,
) {
  if (!Number.isFinite(userId) || userId <= 0) {
    throw new ApplicationError("Pessoa inválida.", 400);
  }

  return auth.followPerson(token, userId);
}
