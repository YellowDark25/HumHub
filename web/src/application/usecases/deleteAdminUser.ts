import { ApplicationError } from "../errors";
import type { AdminUserRepository } from "../ports/AdminUserRepository";
import type { AuthRepository } from "../ports/AuthRepository";
import { requireAdminAccess } from "./requireAdminAccess";

export async function deleteAdminUser(
  auth: AuthRepository,
  users: AdminUserRepository,
  token: string,
  userId: number,
) {
  const current = await requireAdminAccess(auth, token);
  if (!Number.isFinite(userId) || userId <= 0) {
    throw new ApplicationError("Usuário inválido.", 400);
  }

  if (current.id === userId) {
    throw new ApplicationError("Você não pode se excluir.", 400);
  }

  await users.deleteUser(token, userId);
}
