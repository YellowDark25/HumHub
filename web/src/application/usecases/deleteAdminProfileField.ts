import { ApplicationError } from "../errors";
import type { AdminProfileRepository } from "../ports/AdminProfileRepository";
import type { AuthRepository } from "../ports/AuthRepository";
import { requireAdminAccess } from "./requireAdminAccess";
import { requirePositiveId } from "./requirePositiveId";

export async function deleteAdminProfileField(
  auth: AuthRepository,
  profiles: AdminProfileRepository,
  token: string,
  fieldId: number,
) {
  await requireAdminAccess(auth, token);
  const id = requirePositiveId(fieldId, "Campo inválido.");
  const field = await profiles.getField(token, id);
  if (!field.canDelete) {
    throw new ApplicationError("Este campo do sistema não pode ser excluído.", 400);
  }

  await profiles.deleteField(token, id);
}
