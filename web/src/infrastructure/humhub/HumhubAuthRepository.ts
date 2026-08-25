import {
  ApplicationError,
  isForbidden,
  isUnauthorized,
} from "@/application/errors";
import type { AuthRepository, LoginResult } from "@/application/ports/AuthRepository";
import type { Account, AccountUpdate } from "@/domain/Account";
import type { Person } from "@/domain/Person";
import type { User } from "@/domain/User";
import { MUST_CHANGE_PASSWORD_MESSAGE } from "@/shared/mustChangePassword";
import { resolveTokenMaxAge } from "../config";
import { humhubRequest } from "./client";
import {
  mapAccount,
  mapDirectoryUser,
  mapUser,
  toHumhubAccount,
  toHumhubProfile,
} from "./mappers";
import type {
  HumhubDirectoryPerson,
  HumhubDirectoryUsers,
  HumhubLoginResponse,
  HumhubPage,
  HumhubUser,
} from "./types";

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

  async impersonate(token: string, userId: number): Promise<LoginResult> {
    const result = await humhubRequest<HumhubLoginResponse>({
      path: "/auth/impersonate",
      token,
      method: "POST",
      body: { userId },
    });

    const impersonatedToken = result.auth_token ?? result.token;
    if (!impersonatedToken) {
      throw new ApplicationError(
        result.message ?? "Não foi possível representar este usuário.",
        400,
      );
    }

    return {
      token: impersonatedToken,
      expiresInSeconds: resolveTokenMaxAge(result.expired_at ?? result.expires),
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

  async listPeople(token: string): Promise<Person[]> {
    const payload = await humhubRequest<HumhubDirectoryUsers>({
      path: "/nexchat/people",
      token,
      origin: "app",
    });

    return (payload.users ?? [])
      .map(mapDirectoryUser)
      .filter((user): user is Person => user !== null);
  }

  async getPerson(token: string, userId: number): Promise<Person> {
    const payload = await humhubRequest<HumhubDirectoryPerson>({
      path: `/nexchat/people/view?id=${userId}`,
      token,
      origin: "app",
    });
    const person = payload.user ? mapDirectoryUser(payload.user) : null;
    if (!person) {
      throw new ApplicationError("Pessoa não encontrada.", 404);
    }

    return person;
  }

  async followPerson(token: string, userId: number): Promise<Person> {
    return this.changeFriendship(token, userId, "follow");
  }

  async unfollowPerson(token: string, userId: number): Promise<Person> {
    return this.changeFriendship(token, userId, "unfollow");
  }

  async blockPerson(token: string, userId: number): Promise<Person> {
    return this.changeFriendship(token, userId, "block");
  }

  private async changeFriendship(
    token: string,
    userId: number,
    action: "follow" | "unfollow" | "block",
  ): Promise<Person> {
    const payload = await humhubRequest<HumhubDirectoryPerson>({
      path: `/nexchat/people/${action}`,
      method: "POST",
      token,
      origin: "app",
      body: { userId },
    });
    const person = payload.user ? mapDirectoryUser(payload.user) : null;
    if (!person) {
      throw new ApplicationError("Não foi possível atualizar a amizade.", 400);
    }

    return person;
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
      path: "/nexchat/account-profile/save",
      method: "POST",
      token,
      origin: "app",
      body: {
        userId,
        ...(update.profile ? { profile: toHumhubProfile(update.profile) } : {}),
        ...(update.account ? { account: toHumhubAccount(update.account) } : {}),
        ...(update.password
          ? {
              password: update.password,
              currentPassword: update.currentPassword ?? "",
            }
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
      path: "/nexchat/account-profile/image",
      method: "POST",
      token,
      origin: "app",
      body: { userId, image: imageDataUrl },
    });

    return mapUser(user);
  }

  async changeOwnPassword(token: string, newPassword: string): Promise<void> {
    await humhubRequest<unknown>({
      path: "/nexchat/account-password/change",
      token,
      method: "POST",
      origin: "app",
      body: {
        newPassword,
        newPasswordConfirm: newPassword,
      },
    });
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
    try {
      const current = await humhubRequest<HumhubUser>({
        path: "/auth/current",
        token,
      });
      if (!current.id) {
        throw new ApplicationError(MUST_CHANGE_PASSWORD_MESSAGE, 403);
      }

      return current;
    } catch (error) {
      if (isForbidden(error)) {
        throw new ApplicationError(MUST_CHANGE_PASSWORD_MESSAGE, 403);
      }

      throw error;
    }
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
