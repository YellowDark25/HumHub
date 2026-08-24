import type { AuthRepository } from "../ports/AuthRepository";
import type { SpaceRepository } from "../ports/SpaceRepository";
import { requireAdminAccess } from "./requireAdminAccess";

export async function listAdminSpaces(
  auth: AuthRepository,
  spaces: SpaceRepository,
  token: string,
) {
  await requireAdminAccess(auth, token);
  return spaces.listAll(token);
}
