import type { AdminGroupRepository } from "../ports/AdminGroupRepository";
import type { AuthRepository } from "../ports/AuthRepository";
import { requireAdminAccess } from "./requireAdminAccess";
import { requirePositiveId } from "./requirePositiveId";

export async function getAdminGroup(
  auth: AuthRepository,
  groups: AdminGroupRepository,
  token: string,
  groupId: number,
) {
  await requireAdminAccess(auth, token);
  return groups.getGroup(token, requirePositiveId(groupId, "Grupo inválido."));
}
