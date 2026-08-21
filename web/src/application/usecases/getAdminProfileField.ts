import type { AdminProfileRepository } from "../ports/AdminProfileRepository";
import type { AuthRepository } from "../ports/AuthRepository";
import { requireAdminAccess } from "./requireAdminAccess";
import { requirePositiveId } from "./requirePositiveId";

export async function getAdminProfileField(
  auth: AuthRepository,
  profiles: AdminProfileRepository,
  token: string,
  fieldId: number,
) {
  await requireAdminAccess(auth, token);
  return profiles.getField(
    token,
    requirePositiveId(fieldId, "Campo inválido."),
  );
}
