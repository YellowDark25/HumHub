import { ApplicationError } from "../errors";

const MIN_USERNAME_LENGTH = 4;
const MAX_USERNAME_LENGTH = 45;
const USERNAME_PATTERN = /^[\p{L}\d_\-@.]+$/u;

export function readUsername(value: string): string {
  const username = value.trim();
  if (!username) {
    throw new ApplicationError("Informe o nome de usuário.", 400);
  }

  if (username.length < MIN_USERNAME_LENGTH) {
    throw new ApplicationError(
      "O nome de usuário deve ter pelo menos 4 caracteres.",
      400,
    );
  }

  if (username.length > MAX_USERNAME_LENGTH) {
    throw new ApplicationError(
      "O nome de usuário pode ter no máximo 45 caracteres.",
      400,
    );
  }

  if (!USERNAME_PATTERN.test(username)) {
    throw new ApplicationError(
      "O nome de usuário não pode ter espaços. Use letras, números, ponto, hífen ou underline.",
      400,
    );
  }

  return username;
}
