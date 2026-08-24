import type { MediaFile } from "@/domain/MediaFile";

export interface MediaRepository {
  getPublicFile(
    path: string,
    search: string,
    token: string,
  ): Promise<MediaFile>;
}
