import type { AuthRepository } from "../ports/AuthRepository";
import type { AdminUserRepository } from "../ports/AdminUserRepository";
import { requireAdminAccess } from "./requireAdminAccess";

export async function listAdminUsers(
  auth: AuthRepository,
  users: AdminUserRepository,
  token: string,
) {
  await requireAdminAccess(auth, token);
  return users.listUsers(token);
}
