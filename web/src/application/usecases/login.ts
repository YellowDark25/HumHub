import { ApplicationError } from "../errors";
import type { AuthRepository } from "../ports/AuthRepository";

export async function login(
  auth: AuthRepository,
  username: string,
  password: string,
) {
  const trimmedUser = username.trim();
  if (!trimmedUser || !password) {
    throw new ApplicationError("Informe usuário e senha.", 400);
  }

  return auth.login(trimmedUser, password);
}
