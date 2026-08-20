import { ApplicationError } from "../errors";
import type { AccountModulesRepository } from "../ports/AccountModulesRepository";

export function disableAccountModule(
  modules: AccountModulesRepository,
  token: string,
  moduleId: string,
) {
  const id = moduleId.trim();
  if (!id) {
    throw new ApplicationError("Informe o módulo.", 400);
  }

  return modules.disable(token, id);
}
