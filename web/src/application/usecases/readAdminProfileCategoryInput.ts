import type { AdminProfileCategoryInput } from "@/domain/AdminProfile";
import { ApplicationError } from "../errors";

const DEFAULT_SORT_ORDER = 100;

export function readAdminProfileCategoryInput(
  input: AdminProfileCategoryInput,
): AdminProfileCategoryInput {
  const title = input.title.trim();
  if (!title) {
    throw new ApplicationError("Informe o nome da categoria.", 400);
  }

  const sortOrder = Number.isFinite(input.sortOrder)
    ? Math.trunc(input.sortOrder)
    : DEFAULT_SORT_ORDER;

  return {
    title,
    description: input.description.trim(),
    sortOrder: sortOrder > 0 ? sortOrder : DEFAULT_SORT_ORDER,
  };
}
