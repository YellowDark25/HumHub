import type { AuthRepository } from "../ports/AuthRepository";

export async function getCurrentUser(auth: AuthRepository, token: string) {
  const user = await auth.getCurrentUser(token);
  return { ...user, isOnline: true };
}
