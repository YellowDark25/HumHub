import { ApplicationError, isForbidden } from "../errors";
import type { AuthRepository } from "../ports/AuthRepository";
import { readNewPassword } from "./readNewPassword";

export async function completeRequiredPasswordChange(
  auth: AuthRepository,
  token: string,
  newPassword: string,
  newPasswordConfirm: string,
) {
  const password = readNewPassword(newPassword, newPasswordConfirm);

  try {
    await auth.changeOwnPassword(token, password);
  } catch (error) {
    if (isForbidden(error)) {
      throw new ApplicationError(
        "Não foi possível salvar a nova senha. Tente novamente.",
        502,
      );
    }

    throw error;
  }
}
