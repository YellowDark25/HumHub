import type { SpaceRepository } from "@/application/ports/SpaceRepository";
import type { Space } from "@/domain/Space";
import type { SpaceMember } from "@/domain/SpaceMember";
import { humhubRequest } from "./client";
import { MEMBER_PAGE_LIMIT, SPACE_PAGE_LIMIT } from "./constants";
import { mapSpace, mapSpaceMember } from "./mappers";
import type { HumhubMembership, HumhubPage, HumhubSpace } from "./types";

export class HumhubSpaceRepository implements SpaceRepository {
  async list(token: string): Promise<Space[]> {
    const page = await humhubRequest<HumhubPage<HumhubSpace>>({
      path: `/space?limit=${SPACE_PAGE_LIMIT}`,
      token,
    });

    return (page.results ?? []).map(mapSpace);
  }

  async getById(token: string, spaceId: number): Promise<Space> {
    const dto = await fetchSpaceDto(token, spaceId);
    return mapSpace(dto);
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
}

export function fetchSpaceDto(token: string, spaceId: number) {
  return humhubRequest<HumhubSpace>({
    path: `/space/${spaceId}`,
    token,
  });
}
