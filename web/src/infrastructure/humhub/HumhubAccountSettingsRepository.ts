import type { AccountSettingsRepository } from "@/application/ports/AccountSettingsRepository";
import type {
  AccountGeneralPatch,
  AccountGeneralSettings,
} from "@/domain/AccountGeneralSettings";
import { humhubRequest } from "./client";
import { mapAccountSettings, toHumhubAccountSettings } from "./mappers";
import type { HumhubAccountSettings } from "./types";

export class HumhubAccountSettingsRepository
  implements AccountSettingsRepository
{
  async get(token: string): Promise<AccountGeneralSettings> {
    const dto = await humhubRequest<HumhubAccountSettings>({
      path: "/nexchat/account-settings",
      token,
      origin: "app",
    });

    return mapAccountSettings(dto);
  }

  async save(
    token: string,
    patch: AccountGeneralPatch,
  ): Promise<AccountGeneralSettings> {
    const dto = await humhubRequest<HumhubAccountSettings>({
      path: "/nexchat/account-settings/save",
      method: "POST",
      token,
      origin: "app",
      body: toHumhubAccountSettings(patch),
    });

    return mapAccountSettings(dto);
  }
}
