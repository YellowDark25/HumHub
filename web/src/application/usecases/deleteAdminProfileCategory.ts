import { ApplicationError } from "../errors";
import type { AdminProfileRepository } from "../ports/AdminProfileRepository";
import type { AuthRepository } from "../ports/AuthRepository";
import { requireAdminAccess } from "./requireAdminAccess";
import { requirePositiveId } from "./requirePositiveId";

export async function deleteAdminProfileCategory(
  auth: AuthRepository,
  profiles: AdminProfileRepository,
  token: string,
  categoryId: number,
) {
  await requireAdminAccess(auth, token);
  const id = requirePositiveId(categoryId, "Categoria inválida.");
  const category = await profiles.getCategory(token, id);
  if (!category.canDelete) {
    throw new ApplicationError(
      category.fields.length > 0
        ? "Só é possível excluir categorias sem campos."
        : "Esta categoria do sistema não pode ser excluída.",
      400,
    );
  }

  await profiles.deleteCategory(token, id);
}
