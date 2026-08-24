import { ApplicationError } from "@/application/errors";
import type { MediaRepository } from "@/application/ports/MediaRepository";
import type { MediaFile } from "@/domain/MediaFile";
import { getHumhubUrl } from "../config";

export class HumhubMediaRepository implements MediaRepository {
  async getPublicFile(
    path: string,
    search: string,
    token: string,
  ): Promise<MediaFile> {
    const encodedPath = path
      .split("/")
      .map((segment) => encodeURIComponent(segment))
      .join("/");
    const response = await fetch(`${getHumhubUrl()}/${encodedPath}${search}`, {
      headers: {
        Accept: "image/*,application/octet-stream",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new ApplicationError(
        "Imagem não encontrada.",
        response.status === 404 ? 404 : 502,
      );
    }

    return {
      body: await response.arrayBuffer(),
      contentType: response.headers.get("content-type") ?? "image/jpeg",
    };
  }
}
