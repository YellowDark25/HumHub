import type { AdminGroupRepository } from "../ports/AdminGroupRepository";
import type { AuthRepository } from "../ports/AuthRepository";
import { requireAdminAccess } from "./requireAdminAccess";
import { requirePositiveId } from "./requirePositiveId";

export async function listAdminGroupMembers(
  auth: AuthRepository,
  groups: AdminGroupRepository,
  token: string,
  groupId: number,
) {
  await requireAdminAccess(auth, token);
  return groups.listMembers(
    token,
    requirePositiveId(groupId, "Grupo inválido."),
  );
}
