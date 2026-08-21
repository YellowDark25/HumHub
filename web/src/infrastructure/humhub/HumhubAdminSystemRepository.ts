import type { AdminSystemRepository } from "@/application/ports/AdminSystemRepository";
import type { AdminInformation } from "@/domain/AdminInformation";
import type { AdminModule } from "@/domain/AdminModule";
import type { AdminSettings, AdminSettingsPatch } from "@/domain/AdminSettings";
import type { CustomPage } from "@/domain/CustomPage";
import { humhubRequest } from "./client";
import {
  mapAdminInformation,
  mapAdminModules,
  mapAdminSettings,
  mapCustomPages,
} from "./mappers";
import type {
  HumhubAdminInformation,
  HumhubAdminModules,
  HumhubAdminSettings,
  HumhubCustomPages,
} from "./types";

export class HumhubAdminSystemRepository implements AdminSystemRepository {
  listModules(token: string): Promise<AdminModule[]> {
    return this.loadModules(token, "/nexchat/admin/modules");
  }

  enableModule(token: string, moduleId: string): Promise<AdminModule[]> {
    return this.toggleModule(token, "/nexchat/admin/modules/enable", moduleId);
  }

  disableModule(token: string, moduleId: string): Promise<AdminModule[]> {
    return this.toggleModule(token, "/nexchat/admin/modules/disable", moduleId);
  }

  async listPages(token: string): Promise<CustomPage[]> {
    const dto = await humhubRequest<HumhubCustomPages>({
      path: "/nexchat/admin/pages",
      token,
      origin: "app",
    });

    return mapCustomPages(dto);
  }

  async getInformation(token: string): Promise<AdminInformation> {
    const dto = await humhubRequest<HumhubAdminInformation>({
      path: "/nexchat/admin/information",
      token,
      origin: "app",
    });

    return mapAdminInformation(dto);
  }

  async getSettings(token: string): Promise<AdminSettings> {
    return this.loadSettings(token);
  }

  async saveSettings(
    token: string,
    patch: AdminSettingsPatch,
  ): Promise<AdminSettings> {
    const dto = await humhubRequest<HumhubAdminSettings>({
      path: "/nexchat/admin/settings/save",
      token,
      origin: "app",
      method: "POST",
      body: patch,
    });

    return mapAdminSettings(dto);
  }

  private async loadSettings(token: string): Promise<AdminSettings> {
    const dto = await humhubRequest<HumhubAdminSettings>({
      path: "/nexchat/admin/settings",
      token,
      origin: "app",
    });

    return mapAdminSettings(dto);
  }

  private async toggleModule(
    token: string,
    path: string,
    moduleId: string,
  ): Promise<AdminModule[]> {
    return this.loadModules(token, path, moduleId);
  }

  private async loadModules(
    token: string,
    path: string,
    moduleId?: string,
  ): Promise<AdminModule[]> {
    const dto = await humhubRequest<HumhubAdminModules>({
      path,
      token,
      origin: "app",
      ...(moduleId
        ? { method: "POST" as const, body: { moduleId } }
        : {}),
    });

    return mapAdminModules(dto);
  }
}
