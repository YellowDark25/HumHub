import type { AdminGroupRepository } from "../ports/AdminGroupRepository";
import type { AuthRepository } from "../ports/AuthRepository";
import { requireAdminAccess } from "./requireAdminAccess";
import { requirePositiveId } from "./requirePositiveId";

export async function listAdminGroupPermissions(
  auth: AuthRepository,
  groups: AdminGroupRepository,
  token: string,
  groupId: number,
) {
  await requireAdminAccess(auth, token);
  return groups.listPermissions(
    token,
    requirePositiveId(groupId, "Grupo inválido."),
  );
}
