import type { AccountSettingsRepository } from "../ports/AccountSettingsRepository";

export function getAccountGeneralSettings(
  settings: AccountSettingsRepository,
  token: string,
) {
  return settings.get(token);
}
