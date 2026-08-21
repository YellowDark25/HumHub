import type { AdminSettingsPatch } from "@/domain/AdminSettings";
import { ApplicationError } from "../errors";
import type { AdminSystemRepository } from "../ports/AdminSystemRepository";
import type { AuthRepository } from "../ports/AuthRepository";
import { requireAdminAccess } from "./requireAdminAccess";

export async function saveAdminSettings(
  auth: AuthRepository,
  system: AdminSystemRepository,
  token: string,
  patch: AdminSettingsPatch,
) {
  await requireAdminAccess(auth, token);
  return system.saveSettings(token, {
    name: requiredText(patch.name, "Informe o nome da rede."),
    baseUrl: requiredText(patch.baseUrl, "Informe a URL base."),
    defaultLanguage: requiredText(patch.defaultLanguage, "Informe o idioma."),
    timeZone: requiredText(patch.timeZone, "Informe o fuso horário."),
    maintenanceMode: Boolean(patch.maintenanceMode),
  });
}

function requiredText(value: string, message: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new ApplicationError(message, 400);
  }

  return trimmed;
}
