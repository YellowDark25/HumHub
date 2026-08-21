import type { AdminGroupInput } from "@/domain/AdminGroup";
import { ApplicationError } from "../errors";
import type { AdminGroupRepository } from "../ports/AdminGroupRepository";
import type { AuthRepository } from "../ports/AuthRepository";
import { readAdminGroupInput } from "./readAdminGroupInput";
import { requireAdminAccess } from "./requireAdminAccess";
import { requirePositiveId } from "./requirePositiveId";

export async function updateAdminGroup(
  auth: AuthRepository,
  groups: AdminGroupRepository,
  token: string,
  groupId: number,
  input: AdminGroupInput,
) {
  await requireAdminAccess(auth, token);
  const id = requirePositiveId(groupId, "Grupo inválido.");
  const patch = readAdminGroupInput(input);
  const group = await groups.getGroup(token, id);

  if (group.isAdminGroup && (patch.isDefault || patch.showAtRegistration)) {
    throw new ApplicationError(
      "O grupo de administradores não pode ser padrão nem aparecer no registro.",
      400,
    );
  }

  return groups.updateGroup(token, id, patch);
}
