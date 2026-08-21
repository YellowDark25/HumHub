import { ApplicationError } from "../errors";
import type { AuthRepository } from "../ports/AuthRepository";
import { requireAdminAccess } from "./requireAdminAccess";

export async function impersonateAdminUser(
  auth: AuthRepository,
  token: string,
  userId: number,
) {
  const current = await requireAdminAccess(auth, token);
  if (!Number.isFinite(userId) || userId <= 0) {
    throw new ApplicationError("Usuário inválido.", 400);
  }

  if (current.id === userId) {
    throw new ApplicationError("Você não pode se representar.", 400);
  }

  return auth.impersonate(token, userId);
}
