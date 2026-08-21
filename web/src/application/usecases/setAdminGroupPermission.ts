import type { AdminGroupPermissionState } from "@/domain/AdminGroup";
import { ApplicationError } from "../errors";
import type { AdminGroupRepository } from "../ports/AdminGroupRepository";
import type { AuthRepository } from "../ports/AuthRepository";
import { requireAdminAccess } from "./requireAdminAccess";
import { requirePositiveId } from "./requirePositiveId";

const STATES = new Set<AdminGroupPermissionState>(["default", "allow", "deny"]);

export async function setAdminGroupPermission(
  auth: AuthRepository,
  groups: AdminGroupRepository,
  token: string,
  groupId: number,
  permissionId: string,
  moduleId: string,
  state: AdminGroupPermissionState,
) {
  await requireAdminAccess(auth, token);
  const id = requirePositiveId(groupId, "Grupo inválido.");
  const permission = permissionId.trim();
  const module = moduleId.trim();
  if (!permission || !module) {
    throw new ApplicationError("Informe a permissão.", 400);
  }

  if (!STATES.has(state)) {
    throw new ApplicationError("Estado de permissão inválido.", 400);
  }

  return groups.setPermission(token, id, permission, module, state);
}
