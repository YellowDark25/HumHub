import type { AdminProfileCategoryInput } from "@/domain/AdminProfile";
import type { AdminProfileRepository } from "../ports/AdminProfileRepository";
import type { AuthRepository } from "../ports/AuthRepository";
import { readAdminProfileCategoryInput } from "./readAdminProfileCategoryInput";
import { requireAdminAccess } from "./requireAdminAccess";

export async function createAdminProfileCategory(
  auth: AuthRepository,
  profiles: AdminProfileRepository,
  token: string,
  input: AdminProfileCategoryInput,
) {
  await requireAdminAccess(auth, token);
  return profiles.createCategory(token, readAdminProfileCategoryInput(input));
}
