import type { User } from "@/domain/User";

export type LoginResult = {
  token: string;
  expiresInSeconds: number;
};

export interface AuthRepository {
  login(username: string, password: string): Promise<LoginResult>;
  getCurrentUser(token: string): Promise<User>;
}
