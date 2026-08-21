export const ADMIN_USER_STATUSES = [
  "active",
  "disabled",
  "unapproved",
  "deleted",
] as const;

export type AdminUserStatus = (typeof ADMIN_USER_STATUSES)[number];

export type AdminUser = {
  id: number;
  name: string;
  title: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  imageUrl: string;
  lastLogin: string | null;
  status: AdminUserStatus;
};

export type CreateAdminUserInput = {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
};

export type UpdateAdminUserInput = {
  firstName: string;
  lastName: string;
  title: string;
  username: string;
  email: string;
  password: string;
};
