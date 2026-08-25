import type { Person } from "@/domain/Person";
import type { AuthRepository } from "../ports/AuthRepository";

export async function listPeople(
  auth: AuthRepository,
  token: string,
): Promise<Person[]> {
  const people = await auth.listPeople(token);
  return [...people].sort((left, right) =>
    left.name.localeCompare(right.name, "pt-BR"),
  );
}
