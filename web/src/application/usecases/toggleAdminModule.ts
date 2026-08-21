import { ApplicationError } from "../errors";
import type { AdminSystemRepository } from "../ports/AdminSystemRepository";
import type { AuthRepository } from "../ports/AuthRepository";
import { requireAdminAccess } from "./requireAdminAccess";

export async function enableAdminModule(
  auth: AuthRepository,
  system: AdminSystemRepository,
  token: string,
  moduleId: string,
) {
  await requireAdminAccess(auth, token);
  return system.enableModule(token, requiredModuleId(moduleId));
}

export async function disableAdminModule(
  auth: AuthRepository,
  system: AdminSystemRepository,
  token: string,
  moduleId: string,
) {
  await requireAdminAccess(auth, token);
  return system.disableModule(token, requiredModuleId(moduleId));
}

function requiredModuleId(moduleId: string) {
  const trimmed = moduleId.trim();
  if (!trimmed) {
    throw new ApplicationError("Informe o módulo.", 400);
  }

  return trimmed;
}
