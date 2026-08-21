import type { AdminGroupInput } from "@/domain/AdminGroup";
import { ApplicationError } from "../errors";

const DEFAULT_SORT_ORDER = 100;

export function readAdminGroupInput(input: AdminGroupInput): AdminGroupInput {
  const name = input.name.trim();
  if (!name) {
    throw new ApplicationError("Informe o nome do grupo.", 400);
  }

  const sortOrder = Number.isFinite(input.sortOrder)
    ? Math.trunc(input.sortOrder)
    : DEFAULT_SORT_ORDER;

  return {
    name,
    description: input.description.trim(),
    showAtDirectory: Boolean(input.showAtDirectory),
    showAtRegistration: Boolean(input.showAtRegistration),
    notifyUsers: Boolean(input.notifyUsers),
    isDefault: Boolean(input.isDefault),
    sortOrder: sortOrder > 0 ? sortOrder : DEFAULT_SORT_ORDER,
  };
}
