import { ApplicationError } from "../errors";
import type { AdminUserRepository } from "../ports/AdminUserRepository";
import type { AuthRepository } from "../ports/AuthRepository";
import { requireAdminAccess } from "./requireAdminAccess";

export async function getAdminUser(
  auth: AuthRepository,
  users: AdminUserRepository,
  token: string,
  userId: number,
) {
  await requireAdminAccess(auth, token);
  if (!Number.isFinite(userId) || userId <= 0) {
    throw new ApplicationError("Usuário inválido.", 400);
  }

  return users.getUser(token, userId);
}
