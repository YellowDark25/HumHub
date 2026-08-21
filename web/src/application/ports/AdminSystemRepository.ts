import type { AdminInformation } from "@/domain/AdminInformation";
import type { AdminModule } from "@/domain/AdminModule";
import type { AdminSettings, AdminSettingsPatch } from "@/domain/AdminSettings";
import type { CustomPage } from "@/domain/CustomPage";

export interface AdminSystemRepository {
  listModules(token: string): Promise<AdminModule[]>;
  enableModule(token: string, moduleId: string): Promise<AdminModule[]>;
  disableModule(token: string, moduleId: string): Promise<AdminModule[]>;
  listPages(token: string): Promise<CustomPage[]>;
  getInformation(token: string): Promise<AdminInformation>;
  getSettings(token: string): Promise<AdminSettings>;
  saveSettings(token: string, patch: AdminSettingsPatch): Promise<AdminSettings>;
}
