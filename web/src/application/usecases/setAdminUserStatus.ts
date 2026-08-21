import type { AdminUserStatus } from "@/domain/AdminUser";
import { ApplicationError } from "../errors";
import type { AdminUserRepository } from "../ports/AdminUserRepository";
import type { AuthRepository } from "../ports/AuthRepository";
import { requireAdminAccess } from "./requireAdminAccess";

export async function setAdminUserStatus(
  auth: AuthRepository,
  users: AdminUserRepository,
  token: string,
  userId: number,
  status: AdminUserStatus,
) {
  const current = await requireAdminAccess(auth, token);
  if (!Number.isFinite(userId) || userId <= 0) {
    throw new ApplicationError("Usuário inválido.", 400);
  }

  if (current.id === userId) {
    throw new ApplicationError("Você não pode alterar o próprio status.", 400);
  }

  if (status !== "active" && status !== "disabled") {
    throw new ApplicationError("Status inválido.", 400);
  }

  return users.setStatus(token, userId, status);
}
