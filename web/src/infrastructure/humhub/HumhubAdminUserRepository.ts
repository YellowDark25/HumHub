import type { AdminUserRepository } from "@/application/ports/AdminUserRepository";
import type {
  AdminUser,
  AdminUserStatus,
  CreateAdminUserInput,
  UpdateAdminUserInput,
} from "@/domain/AdminUser";
import { humhubRequest } from "./client";
import {
  HUMHUB_USER_STATUS_DISABLED,
  HUMHUB_USER_STATUS_ENABLED,
  HUMHUB_USER_STATUS_NEED_APPROVAL,
  HUMHUB_USER_STATUS_SOFT_DELETED,
  USER_PAGE_LIMIT,
} from "./constants";
import { mapAdminUser } from "./mappers";
import type { HumhubPage, HumhubUser } from "./types";

export class HumhubAdminUserRepository implements AdminUserRepository {
  async listUsers(token: string): Promise<AdminUser[]> {
    const users: AdminUser[] = [];

    for await (const dto of paginate<HumhubUser>(token, "/user", USER_PAGE_LIMIT)) {
      users.push(mapAdminUser(dto));
    }

    return users;
  }

  async createUser(
    token: string,
    input: CreateAdminUserInput,
  ): Promise<AdminUser> {
    const dto = await humhubRequest<HumhubUser>({
      path: "/user",
      token,
      method: "POST",
      body: {
        account: {
          username: input.username,
          email: input.email,
        },
        profile: {
          firstname: input.firstName,
          lastname: input.lastName,
        },
        password: {
          newPassword: input.password,
          mustChangePassword: true,
        },
      },
    });

    return mapAdminUser(dto);
  }

  async getUser(token: string, userId: number): Promise<AdminUser> {
    const dto = await humhubRequest<HumhubUser>({
      path: `/user/${userId}`,
      token,
    });

    return mapAdminUser(dto);
  }

  async updateUser(
    token: string,
    userId: number,
    input: UpdateAdminUserInput,
  ): Promise<AdminUser> {
    const dto = await humhubRequest<HumhubUser>({
      path: `/user/${userId}`,
      token,
      method: "PUT",
      body: {
        account: {
          username: input.username,
          email: input.email,
        },
        profile: {
          firstname: input.firstName,
          lastname: input.lastName,
          title: input.title,
        },
        ...(input.password
          ? { password: { newPassword: input.password } }
          : {}),
      },
    });

    return mapAdminUser(dto);
  }

  async setStatus(
    token: string,
    userId: number,
    status: AdminUserStatus,
  ): Promise<AdminUser> {
    const dto = await humhubRequest<HumhubUser>({
      path: `/user/${userId}`,
      token,
      method: "PUT",
      body: {
        account: { status: toHumhubUserStatus(status) },
      },
    });

    return mapAdminUser(dto);
  }

  async deleteUser(token: string, userId: number): Promise<void> {
    await humhubRequest<unknown>({
      path: `/user/${userId}`,
      token,
      method: "DELETE",
    });
  }
}

function toHumhubUserStatus(status: AdminUserStatus) {
  if (status === "disabled") {
    return HUMHUB_USER_STATUS_DISABLED;
  }

  if (status === "unapproved") {
    return HUMHUB_USER_STATUS_NEED_APPROVAL;
  }

  if (status === "deleted") {
    return HUMHUB_USER_STATUS_SOFT_DELETED;
  }

  return HUMHUB_USER_STATUS_ENABLED;
}

const MAX_ADMIN_PAGES = 10;

async function* paginate<T>(
  token: string,
  path: string,
  limit: number,
): AsyncGenerator<T> {
  for (let page = 1; page <= MAX_ADMIN_PAGES; page += 1) {
    const separator = path.includes("?") ? "&" : "?";
    const payload = await humhubRequest<HumhubPage<T>>({
      path: `${path}${separator}limit=${limit}&page=${page}`,
      token,
    });

    for (const item of payload.results ?? []) {
      yield item;
    }

    const totalPages = payload.pages ?? 1;
    if (page >= totalPages) {
      return;
    }
  }
}
