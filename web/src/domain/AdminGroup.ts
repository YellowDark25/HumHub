export type AdminGroupType = "normal" | "subgroup";

export type AdminGroup = {
  id: number;
  name: string;
  description: string;
  type: AdminGroupType;
  memberCount: number;
  extraMemberCount: number;
  isDefault: boolean;
  isProtected: boolean;
  isAdminGroup: boolean;
  showAtDirectory: boolean;
  showAtRegistration: boolean;
  notifyUsers: boolean;
  sortOrder: number;
  canDelete: boolean;
};

export type AdminGroupInput = {
  name: string;
  description: string;
  showAtDirectory: boolean;
  showAtRegistration: boolean;
  notifyUsers: boolean;
  isDefault: boolean;
  sortOrder: number;
};

export type AdminGroupMember = {
  id: number;
  name: string;
  email: string;
  imageUrl: string;
  isManager: boolean;
};

export type AdminGroupPermissionState = "default" | "allow" | "deny";

export type AdminGroupPermission = {
  id: string;
  moduleId: string;
  moduleName: string;
  title: string;
  description: string;
  state: AdminGroupPermissionState;
  defaultLabel: string;
  canChange: boolean;
};
