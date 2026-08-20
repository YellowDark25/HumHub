import { ApplicationError } from "../errors";
import type { AuthRepository } from "../ports/AuthRepository";
import { requireCurrentPassword } from "./requireCurrentPassword";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LENGTH = 150;

export async function changeEmail(
  auth: AuthRepository,
  token: string,
  email: string,
  currentPassword: string,
) {
  const trimmed = email.trim();
  if (!EMAIL_PATTERN.test(trimmed) || trimmed.length > MAX_EMAIL_LENGTH) {
    throw new ApplicationError("Informe um e-mail válido.", 400);
  }

  const account = await auth.getAccount(token);
  await requireCurrentPassword(auth, account.username, currentPassword);
  return auth.updateUser(token, account.userId, {
    account: { email: trimmed },
  });
}
