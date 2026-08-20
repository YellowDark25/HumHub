import type {
  AccountGeneralPatch,
  AccountGeneralSettings,
} from "@/domain/AccountGeneralSettings";

export interface AccountSettingsRepository {
  get(token: string): Promise<AccountGeneralSettings>;
  save(
    token: string,
    patch: AccountGeneralPatch,
  ): Promise<AccountGeneralSettings>;
}
