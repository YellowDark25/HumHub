import { ApplicationError } from "../errors";
import type { AuthRepository } from "../ports/AuthRepository";
import { requireCurrentPassword } from "./requireCurrentPassword";

const MIN_PASSWORD_LENGTH = 5;
const MAX_PASSWORD_LENGTH = 45;

export async function changePassword(
  auth: AuthRepository,
  token: string,
  currentPassword: string,
  newPassword: string,
  newPasswordConfirm: string,
) {
  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    throw new ApplicationError(
      "A nova senha deve ter pelo menos 5 caracteres.",
      400,
    );
  }

  if (newPassword.length > MAX_PASSWORD_LENGTH) {
    throw new ApplicationError(
      "A nova senha pode ter no máximo 45 caracteres.",
      400,
    );
  }

  if (newPassword !== newPasswordConfirm) {
    throw new ApplicationError("A confirmação da senha não confere.", 400);
  }

  const account = await auth.getAccount(token);
  await requireCurrentPassword(auth, account.username, currentPassword);
  await auth.updateUser(token, account.userId, { password: newPassword });
}
