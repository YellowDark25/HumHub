import type { AdminGroupRepository } from "../ports/AdminGroupRepository";
import type { AuthRepository } from "../ports/AuthRepository";
import { requireAdminAccess } from "./requireAdminAccess";
import { requirePositiveId } from "./requirePositiveId";

export async function addAdminGroupMember(
  auth: AuthRepository,
  groups: AdminGroupRepository,
  token: string,
  groupId: number,
  userId: number,
  isManager: boolean,
) {
  await requireAdminAccess(auth, token);
  return groups.addMember(
    token,
    requirePositiveId(groupId, "Grupo inválido."),
    requirePositiveId(userId, "Usuário inválido."),
    Boolean(isManager),
  );
}
