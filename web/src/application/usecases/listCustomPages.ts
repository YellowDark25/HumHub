import type { AuthRepository } from "../ports/AuthRepository";
import type { AdminSystemRepository } from "../ports/AdminSystemRepository";
import { requireAdminAccess } from "./requireAdminAccess";

export async function listCustomPages(
  auth: AuthRepository,
  system: AdminSystemRepository,
  token: string,
) {
  await requireAdminAccess(auth, token);
  return system.listPages(token);
}
