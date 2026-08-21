import type { AdminProfileRepository } from "../ports/AdminProfileRepository";
import type { AuthRepository } from "../ports/AuthRepository";
import { requireAdminAccess } from "./requireAdminAccess";
import { requirePositiveId } from "./requirePositiveId";

export async function getAdminProfileCategory(
  auth: AuthRepository,
  profiles: AdminProfileRepository,
  token: string,
  categoryId: number,
) {
  await requireAdminAccess(auth, token);
  return profiles.getCategory(
    token,
    requirePositiveId(categoryId, "Categoria inválida."),
  );
}
