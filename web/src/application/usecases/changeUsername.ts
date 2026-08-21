import type { AuthRepository } from "../ports/AuthRepository";
import { readUsername } from "./readUsername";
import { requireCurrentPassword } from "./requireCurrentPassword";

export async function changeUsername(
  auth: AuthRepository,
  token: string,
  username: string,
  currentPassword: string,
) {
  const trimmed = readUsername(username);
  const account = await auth.getAccount(token);
  await requireCurrentPassword(auth, account.username, currentPassword);
  return auth.updateUser(token, account.userId, {
    account: { username: trimmed },
  });
}
