import type { AuthRepository } from "../ports/AuthRepository";

export function getCurrentUser(auth: AuthRepository, token: string) {
  return auth.getCurrentUser(token);
}
