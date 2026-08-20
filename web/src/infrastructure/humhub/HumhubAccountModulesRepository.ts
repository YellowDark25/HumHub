import type { AccountModulesRepository } from "@/application/ports/AccountModulesRepository";
import type { AccountProfileModule } from "@/domain/AccountProfileModule";
import { humhubRequest } from "./client";
import { mapAccountModules } from "./mappers";
import type { HumhubAccountModules } from "./types";

export class HumhubAccountModulesRepository
  implements AccountModulesRepository
{
  async list(token: string): Promise<AccountProfileModule[]> {
    return this.request(token, "/nexchat/account-modules");
  }

  async enable(
    token: string,
    moduleId: string,
  ): Promise<AccountProfileModule[]> {
    return this.request(token, "/nexchat/account-modules/enable", moduleId);
  }

  async disable(
    token: string,
    moduleId: string,
  ): Promise<AccountProfileModule[]> {
    return this.request(token, "/nexchat/account-modules/disable", moduleId);
  }

  private async request(
    token: string,
    path: string,
    moduleId?: string,
  ): Promise<AccountProfileModule[]> {
    const dto = await humhubRequest<HumhubAccountModules>({
      path,
      token,
      origin: "app",
      ...(moduleId
        ? { method: "POST" as const, body: { moduleId } }
        : {}),
    });

    return mapAccountModules(dto);
  }
}
