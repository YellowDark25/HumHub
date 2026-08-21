import type { AdminProfileRepository } from "../ports/AdminProfileRepository";
import type { AuthRepository } from "../ports/AuthRepository";
import { requireAdminAccess } from "./requireAdminAccess";

export async function listAdminProfileCatalog(
  auth: AuthRepository,
  profiles: AdminProfileRepository,
  token: string,
) {
  await requireAdminAccess(auth, token);
  return profiles.listCatalog(token);
}
