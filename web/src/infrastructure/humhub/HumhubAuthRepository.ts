import { ApplicationError, isUnauthorized } from "@/application/errors";
import type { AuthRepository, LoginResult } from "@/application/ports/AuthRepository";
import type { Account, AccountUpdate } from "@/domain/Account";
import type { User } from "@/domain/User";
import { resolveTokenMaxAge } from "../config";
import { humhubRequest } from "./client";
import { mapAccount, mapUser, toHumhubAccount, toHumhubProfile } from "./mappers";
import type { HumhubLoginResponse, HumhubPage, HumhubUser } from "./types";

export class HumhubAuthRepository implements AuthRepository {
  async login(username: string, password: string): Promise<LoginResult> {
    const result = await humhubRequest<HumhubLoginResponse>({
      path: "/auth/login",
      method: "POST",
      body: { username, password },
    });

    if (!result.auth_token) {
      throw new ApplicationError(
        result.message ?? "Não foi possível autenticar.",
        401,
      );
    }

    return {
      token: result.auth_token,
      expiresInSeconds: resolveTokenMaxAge(result.expired_at),
    };
  }

  async getCurrentUser(token: string): Promise<User> {
    const user = await this.loadFullDto(token);
    return mapUser(user, await this.canAccessAdministration(token));
  }

  async getUser(token: string, userId: number): Promise<User> {
    const user = await humhubRequest<HumhubUser>({
      path: `/user/${userId}`,
      token,
    });

    return mapUser(user);
  }

  async getAccount(token: string): Promise<Account> {
    return mapAccount(await this.loadFullDto(token));
  }

  async updateUser(
    token: string,
    userId: number,
    update: AccountUpdate,
  ): Promise<Account> {
    const user = await humhubRequest<HumhubUser>({
      path: `/user/${userId}`,
      method: "PUT",
      token,
      body: {
        ...(update.profile ? { profile: toHumhubProfile(update.profile) } : {}),
        ...(update.account ? { account: toHumhubAccount(update.account) } : {}),
        ...(update.password
          ? { password: { newPassword: update.password } }
          : {}),
      },
    });

    return mapAccount(user);
  }

  async deleteAccount(token: string, userId: number): Promise<void> {
    await humhubRequest<unknown>({
      path: `/user/${userId}`,
      method: "DELETE",
      token,
    });
  }

  async updateProfileImage(
    token: string,
    userId: number,
    imageDataUrl: string,
  ): Promise<User> {
    const user = await humhubRequest<HumhubUser>({
      path: `/user/${userId}`,
      method: "PUT",
      token,
      body: { profile: { image: imageDataUrl } },
    });

    return mapUser(user);
  }

  private async loadFullDto(token: string): Promise<HumhubUser> {
    const current = await this.loadCurrentDto(token);

    try {
      const full = await humhubRequest<HumhubUser>({
        path: `/user/${current.id}`,
        token,
      });
      return mergeUserDto(current, full);
    } catch (error) {
      if (isUnauthorized(error)) {
        throw error;
      }

      return current;
    }
  }

  private async loadCurrentDto(token: string): Promise<HumhubUser> {
    return humhubRequest<HumhubUser>({
      path: "/auth/current",
      token,
    });
  }

  private async canAccessAdministration(token: string): Promise<boolean> {
    try {
      await humhubRequest<HumhubPage<unknown>>({
        path: "/user/group?limit=1",
        token,
      });
      return true;
    } catch (error) {
      if (isUnauthorized(error)) {
        throw error;
      }

      return false;
    }
  }
}

function mergeUserDto(current: HumhubUser, full: HumhubUser): HumhubUser {
  return {
    ...current,
    ...full,
    account: { ...current.account, ...full.account },
    profile: { ...current.profile, ...full.profile },
  };
}
