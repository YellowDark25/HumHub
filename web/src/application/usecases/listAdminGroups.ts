import type { AdminGroupRepository } from "../ports/AdminGroupRepository";
import type { AuthRepository } from "../ports/AuthRepository";
import { requireAdminAccess } from "./requireAdminAccess";

export async function listAdminGroups(
  auth: AuthRepository,
  groups: AdminGroupRepository,
  token: string,
) {
  await requireAdminAccess(auth, token);
  return groups.listGroups(token);
}
