import { ApplicationError } from "@/application/errors";
import type { SpaceRepository } from "@/application/ports/SpaceRepository";
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
import { humhubRequest } from "./client";
import {
  MEMBER_PAGE_LIMIT,
  SPACE_JOIN_POLICY_FREE,
  SPACE_JOIN_POLICY_NONE,
  SPACE_PAGE_LIMIT,
  SPACE_VISIBILITY_NONE,
  SPACE_VISIBILITY_REGISTERED,
} from "./constants";
import {
  mapReceivedSpaceInvite,
  mapSpace,
  mapSpaceInvitee,
  mapSpaceMember,
  mapSpaceMembershipSettings,
} from "./mappers";
import type {
  HumhubMembership,
  HumhubMemberSpaces,
  HumhubPage,
  HumhubReceivedSpaceInvites,
  HumhubSpace,
  HumhubSpaceInvitees,
  HumhubSpaceInviteResult,
  HumhubSpaceMembershipSettings,
} from "./types";

export class HumhubSpaceRepository implements SpaceRepository {
  async list(token: string): Promise<Space[]> {
    const payload = await humhubRequest<HumhubMemberSpaces>({
      path: "/nexchat/spaces",
      token,
      origin: "app",
    });

    return (payload.spaces ?? []).map(mapSpace);
  }

  async listVisible(token: string): Promise<Space[]> {
    const payload = await humhubRequest<HumhubMemberSpaces>({
      path: "/nexchat/spaces/directory",
      token,
      origin: "app",
    });

    return (payload.spaces ?? []).map(mapSpace);
  }

  async listAll(token: string): Promise<Space[]> {
    const page = await humhubRequest<HumhubPage<HumhubSpace>>({
      path: `/space?limit=${SPACE_PAGE_LIMIT}`,
      token,
    });

    return (page.results ?? []).map(mapSpace);
  }

  async getById(token: string, spaceId: number): Promise<Space> {
    return (await this.getDetails(token, spaceId)).space;
  }

  async getDetails(
    token: string,
    spaceId: number,
  ): Promise<{ space: Space; membership: SpaceMembershipSettings | null }> {
    const dto = await humhubRequest<HumhubSpace>({
      path: `/nexchat/spaces/view?id=${spaceId}`,
      token,
      origin: "app",
    });

    return {
      space: mapSpace(dto),
      membership: mapSpaceMembershipSettings(dto.membership),
    };
  }

  async listMembers(token: string, spaceId: number): Promise<SpaceMember[]> {
    const page = await humhubRequest<HumhubPage<HumhubMembership>>({
      path: `/space/${spaceId}/membership?limit=${MEMBER_PAGE_LIMIT}`,
      token,
    });

    return (page.results ?? [])
      .map(mapSpaceMember)
      .filter((member): member is SpaceMember => member !== null);
  }

  async listInvitableUsers(
    token: string,
    spaceId: number,
  ): Promise<SpaceInvitee[]> {
    const payload = await humhubRequest<HumhubSpaceInvitees>({
      path: `/nexchat/space-invite/users?id=${spaceId}`,
      token,
      origin: "app",
    });

    return (payload.users ?? [])
      .map(mapSpaceInvitee)
      .filter((user): user is SpaceInvitee => user !== null);
  }

  async inviteMembers(
    token: string,
    spaceId: number,
    input: SpaceInviteInput,
  ): Promise<void> {
    await humhubRequest<HumhubSpaceInviteResult>({
      path: "/nexchat/space-invite/send",
      token,
      origin: "app",
      method: "POST",
      body: {
        spaceId,
        userIds: input.userIds,
        selectAllRegistered: input.selectAllRegistered,
        addWithoutInvite: input.addWithoutInvite,
        addAsDefaultSpace: input.addAsDefaultSpace,
      },
    });
  }

  async listReceivedInvites(token: string): Promise<ReceivedSpaceInvite[]> {
    const payload = await humhubRequest<HumhubReceivedSpaceInvites>({
      path: "/nexchat/space-invite/received",
      token,
      origin: "app",
    });

    return (payload.invites ?? [])
      .map(mapReceivedSpaceInvite)
      .filter((invite): invite is ReceivedSpaceInvite => invite !== null);
  }

  async acceptInvite(token: string, spaceId: number): Promise<void> {
    await humhubRequest<HumhubSpaceInviteResult>({
      path: "/nexchat/space-invite/accept",
      token,
      origin: "app",
      method: "POST",
      body: { spaceId },
    });
  }

  async declineInvite(token: string, spaceId: number): Promise<void> {
    await humhubRequest<HumhubSpaceInviteResult>({
      path: "/nexchat/space-invite/decline",
      token,
      origin: "app",
      method: "POST",
      body: { spaceId },
    });
  }

  async create(token: string, input: CreateSpaceInput): Promise<Space> {
    try {
      const dto = await humhubRequest<HumhubSpace>({
        path: "/space",
        token,
        method: "POST",
        body: {
          name: input.name,
          description: input.description,
          visibility:
            input.visibility === "private"
              ? SPACE_VISIBILITY_NONE
              : SPACE_VISIBILITY_REGISTERED,
          join_policy:
            input.visibility === "private"
              ? SPACE_JOIN_POLICY_NONE
              : SPACE_JOIN_POLICY_FREE,
        },
      });

      return mapSpace(dto);
    } catch (error) {
      if (error instanceof ApplicationError && error.status === 422) {
        throw new ApplicationError(
          "Não foi possível criar o espaço. Confira se o nome já está em uso.",
          422,
        );
      }

      throw error;
    }
  }

  async follow(token: string, spaceId: number): Promise<Space> {
    const dto = await humhubRequest<HumhubSpace>({
      path: "/nexchat/spaces/follow",
      token,
      origin: "app",
      method: "POST",
      body: { spaceId },
    });

    return mapSpace(dto);
  }

  async updateImage(
    token: string,
    spaceId: number,
    imageDataUrl: string,
  ): Promise<Space> {
    return uploadSpaceMedia(token, spaceId, "image", imageDataUrl);
  }

  async updateBanner(
    token: string,
    spaceId: number,
    imageDataUrl: string,
  ): Promise<Space> {
    return uploadSpaceMedia(token, spaceId, "banner", imageDataUrl);
  }

  async updateMembershipSettings(
    token: string,
    spaceId: number,
    patch: SpaceMembershipSettingsPatch,
  ): Promise<SpaceMembershipSettings> {
    const payload = await humhubRequest<{
      membership?: HumhubSpaceMembershipSettings | null;
    }>({
      path: "/nexchat/spaces/save-membership",
      token,
      origin: "app",
      method: "POST",
      body: { spaceId, ...patch },
    });

    const membership = mapSpaceMembershipSettings(payload.membership);
    if (!membership) {
      throw new ApplicationError("Você não é membro deste espaço.", 403);
    }

    return membership;
  }

  async leave(token: string, spaceId: number): Promise<void> {
    await humhubRequest({
      path: "/nexchat/spaces/leave",
      token,
      origin: "app",
      method: "POST",
      body: { spaceId },
    });
  }
}

async function uploadSpaceMedia(
  token: string,
  spaceId: number,
  kind: "image" | "banner",
  imageDataUrl: string,
): Promise<Space> {
  await humhubRequest({
    path: `/nexchat/space-image/upload-${kind}?id=${spaceId}`,
    token,
    method: "POST",
    body: { image: imageDataUrl },
    origin: "app",
  });

  return mapSpace(await fetchSpaceDto(token, spaceId));
}

export function fetchSpaceDto(token: string, spaceId: number) {
  return humhubRequest<HumhubSpace>({
    path: `/space/${spaceId}`,
    token,
  });
}
