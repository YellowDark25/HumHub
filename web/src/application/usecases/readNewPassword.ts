import { ApplicationError } from "../errors";

const MIN_PASSWORD_LENGTH = 5;
const MAX_PASSWORD_LENGTH = 45;

export function readNewPassword(
  newPassword: string,
  newPasswordConfirm: string,
): string {
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

  return newPassword;
}
