import { ApplicationError } from "../errors";
import type { AuthRepository } from "../ports/AuthRepository";
import { requireCurrentPassword } from "./requireCurrentPassword";

const MIN_USERNAME_LENGTH = 4;
const MAX_USERNAME_LENGTH = 45;

export async function changeUsername(
  auth: AuthRepository,
  token: string,
  username: string,
  currentPassword: string,
) {
  const trimmed = username.trim();
  if (trimmed.length < MIN_USERNAME_LENGTH) {
    throw new ApplicationError(
      "O nome de usuário deve ter pelo menos 4 caracteres.",
      400,
    );
  }

  if (trimmed.length > MAX_USERNAME_LENGTH) {
    throw new ApplicationError(
      "O nome de usuário pode ter no máximo 45 caracteres.",
      400,
    );
  }

  const account = await auth.getAccount(token);
  await requireCurrentPassword(auth, account.username, currentPassword);
  return auth.updateUser(token, account.userId, {
    account: { username: trimmed },
  });
}
