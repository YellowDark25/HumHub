import type { CreateSpaceInput, Space } from "@/domain/Space";
import type {
  ReceivedSpaceInvite,
  SpaceInvitee,
  SpaceInviteInput,
} from "@/domain/SpaceInvite";
import type { SpaceMember } from "@/domain/SpaceMember";
import type {
  SpaceMembershipSettings,
  SpaceMembershipSettingsPatch,
} from "@/domain/SpaceMembershipSettings";

export interface SpaceRepository {
  list(token: string): Promise<Space[]>;
  listVisible(token: string): Promise<Space[]>;
  listAll(token: string): Promise<Space[]>;
  getById(token: string, spaceId: number): Promise<Space>;
  getDetails(
    token: string,
    spaceId: number,
  ): Promise<{ space: Space; membership: SpaceMembershipSettings | null }>;
  listMembers(token: string, spaceId: number): Promise<SpaceMember[]>;
  listInvitableUsers(token: string, spaceId: number): Promise<SpaceInvitee[]>;
  inviteMembers(
    token: string,
    spaceId: number,
    input: SpaceInviteInput,
  ): Promise<void>;
  listReceivedInvites(token: string): Promise<ReceivedSpaceInvite[]>;
  acceptInvite(token: string, spaceId: number): Promise<void>;
  declineInvite(token: string, spaceId: number): Promise<void>;
  create(token: string, input: CreateSpaceInput): Promise<Space>;
  follow(token: string, spaceId: number): Promise<Space>;
  updateImage(token: string, spaceId: number, imageDataUrl: string): Promise<Space>;
  updateBanner(token: string, spaceId: number, imageDataUrl: string): Promise<Space>;
  updateMembershipSettings(
    token: string,
    spaceId: number,
    patch: SpaceMembershipSettingsPatch,
  ): Promise<SpaceMembershipSettings>;
  leave(token: string, spaceId: number): Promise<void>;
};
