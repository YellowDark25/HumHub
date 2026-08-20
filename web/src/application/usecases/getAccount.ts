import type { AuthRepository } from "../ports/AuthRepository";

export function getAccount(auth: AuthRepository, token: string) {
  return auth.getAccount(token);
}
