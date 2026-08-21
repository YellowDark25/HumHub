import type { AdminGroupRepository } from "@/application/ports/AdminGroupRepository";
import type { AdminGroup, AdminGroupInput, AdminGroupMember } from "@/domain/AdminGroup";
import { humhubRequest } from "./client";
import {
  mapAdminGroup,
  mapAdminGroupMembers,
  mapAdminGroups,
} from "./mappers";
import type {
  HumhubAdminGroup,
  HumhubAdminGroupMembers,
  HumhubAdminGroups,
} from "./types";

export class HumhubAdminGroupRepository implements AdminGroupRepository {
  async listGroups(token: string): Promise<AdminGroup[]> {
    const dto = await humhubRequest<HumhubAdminGroups>({
      path: "/nexchat/admin/groups",
      token,
      origin: "app",
    });

    return mapAdminGroups(dto);
  }

  async getGroup(token: string, groupId: number): Promise<AdminGroup> {
    const dto = await humhubRequest<HumhubAdminGroup>({
      path: `/nexchat/admin/groups/view?id=${groupId}`,
      token,
      origin: "app",
    });

    return mapAdminGroup(dto);
  }

  async createGroup(
    token: string,
    input: AdminGroupInput,
  ): Promise<AdminGroup> {
    return this.saveGroup(token, input);
  }

  async updateGroup(
    token: string,
    groupId: number,
    input: AdminGroupInput,
  ): Promise<AdminGroup> {
    return this.saveGroup(token, input, groupId);
  }

  async deleteGroup(token: string, groupId: number): Promise<void> {
    await humhubRequest<unknown>({
      path: `/nexchat/admin/groups/delete?id=${groupId}`,
      token,
      origin: "app",
      method: "POST",
    });
  }

  async listMembers(
    token: string,
    groupId: number,
  ): Promise<AdminGroupMember[]> {
    return this.loadMembers(token, `/nexchat/admin/groups/members?id=${groupId}`);
  }

  async addMember(
    token: string,
    groupId: number,
    userId: number,
    isManager: boolean,
  ): Promise<AdminGroupMember[]> {
    return this.mutateMembers(token, "/nexchat/admin/groups/add-member", {
      id: groupId,
      userId,
      isManager,
    });
  }

  async removeMember(
    token: string,
    groupId: number,
    userId: number,
  ): Promise<AdminGroupMember[]> {
    return this.mutateMembers(token, "/nexchat/admin/groups/remove-member", {
      id: groupId,
      userId,
    });
  }

  async setMemberManager(
    token: string,
    groupId: number,
    userId: number,
    isManager: boolean,
  ): Promise<AdminGroupMember[]> {
    return this.mutateMembers(token, "/nexchat/admin/groups/set-manager", {
      id: groupId,
      userId,
      isManager,
    });
  }

  private async saveGroup(
    token: string,
    input: AdminGroupInput,
    groupId?: number,
  ): Promise<AdminGroup> {
    const dto = await humhubRequest<HumhubAdminGroup>({
      path: "/nexchat/admin/groups/save",
      token,
      origin: "app",
      method: "POST",
      body: {
        ...(groupId ? { id: groupId } : {}),
        ...input,
      },
    });

    return mapAdminGroup(dto);
  }

  private async loadMembers(token: string, path: string) {
    const dto = await humhubRequest<HumhubAdminGroupMembers>({
      path,
      token,
      origin: "app",
    });

    return mapAdminGroupMembers(dto);
  }

  private async mutateMembers(
    token: string,
    path: string,
    body: Record<string, unknown>,
  ) {
    const dto = await humhubRequest<HumhubAdminGroupMembers>({
      path,
      token,
      origin: "app",
      method: "POST",
      body,
    });

    return mapAdminGroupMembers(dto);
  }
}
