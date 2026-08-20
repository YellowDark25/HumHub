import type { AccountModulesRepository } from "../ports/AccountModulesRepository";

export function listAccountModules(
  modules: AccountModulesRepository,
  token: string,
) {
  return modules.list(token);
}
