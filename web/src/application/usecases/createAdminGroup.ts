import type { AdminGroupInput } from "@/domain/AdminGroup";
import type { AdminGroupRepository } from "../ports/AdminGroupRepository";
import type { AuthRepository } from "../ports/AuthRepository";
import { readAdminGroupInput } from "./readAdminGroupInput";
import { requireAdminAccess } from "./requireAdminAccess";

export async function createAdminGroup(
  auth: AuthRepository,
  groups: AdminGroupRepository,
  token: string,
  input: AdminGroupInput,
) {
  await requireAdminAccess(auth, token);
  return groups.createGroup(token, readAdminGroupInput(input));
}
