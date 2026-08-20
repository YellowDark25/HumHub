import type { Space } from "@/domain/Space";
import type { SpaceMember } from "@/domain/SpaceMember";

export interface SpaceRepository {
  list(token: string): Promise<Space[]>;
  getById(token: string, spaceId: number): Promise<Space>;
  listMembers(token: string, spaceId: number): Promise<SpaceMember[]>;
  create(token: string, name: string, description: string): Promise<Space>;
  updateImage(token: string, spaceId: number, imageDataUrl: string): Promise<Space>;
  updateBanner(token: string, spaceId: number, imageDataUrl: string): Promise<Space>;
};
