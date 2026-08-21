import type {
  AdminGroup,
  AdminGroupInput,
  AdminGroupMember,
} from "@/domain/AdminGroup";

export interface AdminGroupRepository {
  listGroups(token: string): Promise<AdminGroup[]>;
  getGroup(token: string, groupId: number): Promise<AdminGroup>;
  createGroup(token: string, input: AdminGroupInput): Promise<AdminGroup>;
  updateGroup(
    token: string,
    groupId: number,
    input: AdminGroupInput,
  ): Promise<AdminGroup>;
  deleteGroup(token: string, groupId: number): Promise<void>;
  listMembers(token: string, groupId: number): Promise<AdminGroupMember[]>;
  addMember(
    token: string,
    groupId: number,
    userId: number,
    isManager: boolean,
  ): Promise<AdminGroupMember[]>;
  removeMember(
    token: string,
    groupId: number,
    userId: number,
  ): Promise<AdminGroupMember[]>;
  setMemberManager(
    token: string,
    groupId: number,
    userId: number,
    isManager: boolean,
  ): Promise<AdminGroupMember[]>;
}
