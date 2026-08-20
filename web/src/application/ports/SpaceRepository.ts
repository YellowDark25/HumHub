import type { Space } from "@/domain/Space";
import type { SpaceMember } from "@/domain/SpaceMember";

export interface SpaceRepository {
  list(token: string): Promise<Space[]>;
  getById(token: string, spaceId: number): Promise<Space>;
  listMembers(token: string, spaceId: number): Promise<SpaceMember[]>;
}
