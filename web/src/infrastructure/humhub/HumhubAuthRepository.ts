import { ApplicationError } from "@/application/errors";
import type { AuthRepository, LoginResult } from "@/application/ports/AuthRepository";
import type { User } from "@/domain/User";
import { resolveTokenMaxAge } from "../config";
import { humhubRequest } from "./client";
import { mapUser } from "./mappers";
import type { HumhubLoginResponse, HumhubUser } from "./types";

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
    const user = await humhubRequest<HumhubUser>({
      path: "/auth/current",
      token,
    });

    return mapUser(user);
  }
}
