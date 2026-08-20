import { ApplicationError, isUnauthorized } from "../errors";
import type { AuthRepository } from "../ports/AuthRepository";

export async function requireCurrentPassword(
  auth: AuthRepository,
  username: string,
  currentPassword: string,
) {
  if (!currentPassword) {
    throw new ApplicationError("Informe a senha atual.", 400);
  }

  try {
    await auth.login(username, currentPassword);
  } catch (error) {
    if (isUnauthorized(error)) {
      throw new ApplicationError("Senha atual incorreta.", 400);
    }

    throw error;
  }
}
