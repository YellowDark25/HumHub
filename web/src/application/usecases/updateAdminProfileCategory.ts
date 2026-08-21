import type { AdminProfileCategoryInput } from "@/domain/AdminProfile";
import type { AdminProfileRepository } from "../ports/AdminProfileRepository";
import type { AuthRepository } from "../ports/AuthRepository";
import { readAdminProfileCategoryInput } from "./readAdminProfileCategoryInput";
import { requireAdminAccess } from "./requireAdminAccess";
import { requirePositiveId } from "./requirePositiveId";

export async function updateAdminProfileCategory(
  auth: AuthRepository,
  profiles: AdminProfileRepository,
  token: string,
  categoryId: number,
  input: AdminProfileCategoryInput,
) {
  await requireAdminAccess(auth, token);
  return profiles.updateCategory(
    token,
    requirePositiveId(categoryId, "Categoria inválida."),
    readAdminProfileCategoryInput(input),
  );
}
