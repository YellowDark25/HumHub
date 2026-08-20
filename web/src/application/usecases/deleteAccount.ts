import type { AuthRepository } from "../ports/AuthRepository";
import { requireCurrentPassword } from "./requireCurrentPassword";

export async function deleteAccount(
  auth: AuthRepository,
  token: string,
  currentPassword: string,
) {
  const account = await auth.getAccount(token);
  await requireCurrentPassword(auth, account.username, currentPassword);
  await auth.deleteAccount(token, account.userId);
}
