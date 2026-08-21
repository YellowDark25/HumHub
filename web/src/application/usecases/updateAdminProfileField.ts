import type { AdminProfileFieldInput } from "@/domain/AdminProfile";
import type { AdminProfileRepository } from "../ports/AdminProfileRepository";
import type { AuthRepository } from "../ports/AuthRepository";
import { readAdminProfileFieldInput } from "./readAdminProfileFieldInput";
import { requireAdminAccess } from "./requireAdminAccess";
import { requirePositiveId } from "./requirePositiveId";

export async function updateAdminProfileField(
  auth: AuthRepository,
  profiles: AdminProfileRepository,
  token: string,
  fieldId: number,
  input: AdminProfileFieldInput,
) {
  await requireAdminAccess(auth, token);
  return profiles.updateField(
    token,
    requirePositiveId(fieldId, "Campo inválido."),
    readAdminProfileFieldInput(input, "update"),
  );
}
