import { ApplicationError } from "../errors";
import type { AuthRepository } from "../ports/AuthRepository";
import { getCurrentUser } from "./getCurrentUser";

export async function requireAdminAccess(
  auth: AuthRepository,
  token: string,
) {
  const user = await getCurrentUser(auth, token);
  if (!user.isAdmin) {
    throw new ApplicationError(
      "Você não tem permissão para acessar esta área.",
      403,
    );
  }

  return user;
}
