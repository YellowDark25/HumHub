import type { AccountPatch } from "@/domain/Account";
import { ApplicationError } from "../errors";
import type { AuthRepository } from "../ports/AuthRepository";

const VISIBILITY_VALUES = new Set([1, 2, 3]);

export async function updateAccountGeneral(
  auth: AuthRepository,
  token: string,
  patch: AccountPatch,
) {
  const language = patch.language?.trim() ?? "";
  const timeZone = patch.timeZone?.trim() ?? "";
  const tags = (patch.tags ?? []).map((tag) => tag.trim()).filter(Boolean);
  const visibility = patch.visibility ?? 1;

  if (!language) {
    throw new ApplicationError("Informe o idioma.", 400);
  }

  if (!timeZone) {
    throw new ApplicationError("Informe o fuso horário.", 400);
  }

  if (!VISIBILITY_VALUES.has(visibility)) {
    throw new ApplicationError("Visibilidade inválida.", 400);
  }

  const account = await auth.getAccount(token);
  return auth.updateUser(token, account.userId, {
    account: { language, timeZone, tags, visibility },
  });
}
