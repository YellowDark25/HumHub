import type { Space } from "@/domain/Space";
import type {
  ReceivedSpaceInvite,
  SpaceInvitee,
  SpaceInviteInput,
} from "@/domain/SpaceInvite";
import type { SpaceMember } from "@/domain/SpaceMember";

export interface SpaceRepository {
  list(token: string): Promise<Space[]>;
  getById(token: string, spaceId: number): Promise<Space>;
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
  create(token: string, name: string, description: string): Promise<Space>;
  updateImage(token: string, spaceId: number, imageDataUrl: string): Promise<Space>;
  updateBanner(token: string, spaceId: number, imageDataUrl: string): Promise<Space>;
};
