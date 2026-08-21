import type {
  AdminUser,
  AdminUserStatus,
  CreateAdminUserInput,
  UpdateAdminUserInput,
} from "@/domain/AdminUser";

export interface AdminUserRepository {
  listUsers(token: string): Promise<AdminUser[]>;
  getUser(token: string, userId: number): Promise<AdminUser>;
  createUser(token: string, input: CreateAdminUserInput): Promise<AdminUser>;
  updateUser(token: string, userId: number, input: UpdateAdminUserInput): Promise<AdminUser>;
  setStatus(
    token: string,
    userId: number,
    status: AdminUserStatus,
  ): Promise<AdminUser>;
  deleteUser(token: string, userId: number): Promise<void>;
}
