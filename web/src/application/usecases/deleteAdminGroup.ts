import { ApplicationError } from "../errors";
import type { AdminGroupRepository } from "../ports/AdminGroupRepository";
import type { AuthRepository } from "../ports/AuthRepository";
import { requireAdminAccess } from "./requireAdminAccess";
import { requirePositiveId } from "./requirePositiveId";

export async function deleteAdminGroup(
  auth: AuthRepository,
  groups: AdminGroupRepository,
  token: string,
  groupId: number,
) {
  await requireAdminAccess(auth, token);
  const id = requirePositiveId(groupId, "Grupo inválido.");
  const group = await groups.getGroup(token, id);
  if (!group.canDelete) {
    throw new ApplicationError("Este grupo não pode ser excluído.", 400);
  }

  await groups.deleteGroup(token, id);
}
