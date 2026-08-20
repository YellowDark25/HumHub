import type { AccountProfileModule } from "@/domain/AccountProfileModule";

export interface AccountModulesRepository {
  list(token: string): Promise<AccountProfileModule[]>;
  enable(token: string, moduleId: string): Promise<AccountProfileModule[]>;
  disable(token: string, moduleId: string): Promise<AccountProfileModule[]>;
}
