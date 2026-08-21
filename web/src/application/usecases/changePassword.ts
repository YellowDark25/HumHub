import type { AuthRepository } from "../ports/AuthRepository";
import { readNewPassword } from "./readNewPassword";
import { requireCurrentPassword } from "./requireCurrentPassword";

export async function changePassword(
  auth: AuthRepository,
  token: string,
  currentPassword: string,
  newPassword: string,
  newPasswordConfirm: string,
) {
  const password = readNewPassword(newPassword, newPasswordConfirm);
  const account = await auth.getAccount(token);
  await requireCurrentPassword(auth, account.username, currentPassword);
  await auth.updateUser(token, account.userId, { password });
}
