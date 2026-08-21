import type { UpdateAdminUserInput } from "@/domain/AdminUser";
import { ApplicationError } from "../errors";
import type { AdminUserRepository } from "../ports/AdminUserRepository";
import type { AuthRepository } from "../ports/AuthRepository";
import { readUsername } from "./readUsername";
import { requireAdminAccess } from "./requireAdminAccess";

export async function updateAdminUser(
  auth: AuthRepository,
  users: AdminUserRepository,
  token: string,
  userId: number,
  input: UpdateAdminUserInput,
) {
  await requireAdminAccess(auth, token);
  if (!Number.isFinite(userId) || userId <= 0) {
    throw new ApplicationError("Usuário inválido.", 400);
  }

  return users.updateUser(token, userId, {
    firstName: requiredText(input.firstName, "Informe o primeiro nome."),
    lastName: requiredText(input.lastName, "Informe o último nome."),
    title: input.title.trim(),
    username: readUsername(input.username),
    email: readEmail(input.email),
    password: input.password.trim(),
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
