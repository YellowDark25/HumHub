import type { CreateAdminUserInput } from "@/domain/AdminUser";
import { ApplicationError } from "../errors";
import type { AdminUserRepository } from "../ports/AdminUserRepository";
import type { AuthRepository } from "../ports/AuthRepository";
import { requireAdminAccess } from "./requireAdminAccess";

const MIN_PASSWORD_LENGTH = 5;

export async function createAdminUser(
  auth: AuthRepository,
  users: AdminUserRepository,
  token: string,
  input: CreateAdminUserInput,
) {
  await requireAdminAccess(auth, token);
  return users.createUser(token, {
    firstName: requiredText(input.firstName, "Informe o primeiro nome."),
    lastName: requiredText(input.lastName, "Informe o último nome."),
    username: requiredText(input.username, "Informe o nome de usuário."),
    email: readEmail(input.email),
    password: readPassword(input.password),
  });
}

function requiredText(value: string, message: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new ApplicationError(message, 400);
  }

  return trimmed;
}

function readEmail(value: string) {
  const email = requiredText(value, "Informe o e-mail.");
  if (!email.includes("@")) {
    throw new ApplicationError("Informe um e-mail válido.", 400);
  }

  return email;
}

function readPassword(value: string) {
  const password = value.trim();
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new ApplicationError(
      `A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`,
      400,
    );
  }

  return password;
}
