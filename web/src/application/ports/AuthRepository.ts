import type { Account, AccountUpdate } from "@/domain/Account";
import type { Person } from "@/domain/Person";
import type { User } from "@/domain/User";

export type LoginResult = {
  token: string;
  expiresInSeconds: number;
};

export interface AuthRepository {
  login(username: string, password: string): Promise<LoginResult>;
  impersonate(token: string, userId: number): Promise<LoginResult>;
  getCurrentUser(token: string): Promise<User>;
  getUser(token: string, userId: number): Promise<User>;
  getPerson(token: string, userId: number): Promise<Person>;
  listPeople(token: string): Promise<Person[]>;
  followPerson(token: string, userId: number): Promise<Person>;
  unfollowPerson(token: string, userId: number): Promise<Person>;
  getAccount(token: string): Promise<Account>;
  updateUser(
    token: string,
    userId: number,
    update: AccountUpdate,
  ): Promise<Account>;
  deleteAccount(token: string, userId: number): Promise<void>;
  updateProfileImage(
    token: string,
    userId: number,
    imageDataUrl: string,
  ): Promise<User>;
  changeOwnPassword(token: string, newPassword: string): Promise<void>;
}
