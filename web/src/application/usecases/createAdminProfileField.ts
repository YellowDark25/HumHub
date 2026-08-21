import type { AdminProfileFieldInput } from "@/domain/AdminProfile";
import type { AdminProfileRepository } from "../ports/AdminProfileRepository";
import type { AuthRepository } from "../ports/AuthRepository";
import { readAdminProfileFieldInput } from "./readAdminProfileFieldInput";
import { requireAdminAccess } from "./requireAdminAccess";

export async function createAdminProfileField(
  auth: AuthRepository,
  profiles: AdminProfileRepository,
  token: string,
  input: AdminProfileFieldInput,
) {
  await requireAdminAccess(auth, token);
  return profiles.createField(
    token,
    readAdminProfileFieldInput(input, "create"),
  );
}
