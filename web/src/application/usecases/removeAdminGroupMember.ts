import type { AdminGroupRepository } from "../ports/AdminGroupRepository";
import type { AuthRepository } from "../ports/AuthRepository";
import { requireAdminAccess } from "./requireAdminAccess";
import { requirePositiveId } from "./requirePositiveId";

export async function removeAdminGroupMember(
  auth: AuthRepository,
  groups: AdminGroupRepository,
  token: string,
  groupId: number,
  userId: number,
) {
  await requireAdminAccess(auth, token);
  return groups.removeMember(
    token,
    requirePositiveId(groupId, "Grupo inválido."),
    requirePositiveId(userId, "Usuário inválido."),
  );
}
