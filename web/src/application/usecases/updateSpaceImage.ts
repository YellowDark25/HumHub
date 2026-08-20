import { MAX_PROFILE_IMAGE_BYTES } from "@/shared/profileImage";
import { ApplicationError } from "../errors";
import type { SpaceRepository } from "../ports/SpaceRepository";

export type SpaceImageKind = "image" | "banner";

const IMAGE_DATA_URL = /^data:image\/(jpeg|jpg|png|gif|webp);base64,/i;

export async function updateSpaceImage(
  spaces: SpaceRepository,
  token: string,
  spaceId: number,
  kind: SpaceImageKind,
  imageDataUrl: string,
) {
  if (!Number.isFinite(spaceId) || spaceId <= 0) {
    throw new ApplicationError("Espaço inválido.", 400);
  }

  if (kind !== "image" && kind !== "banner") {
    throw new ApplicationError("Tipo de imagem inválido.", 400);
  }

  const image = readImageDataUrl(imageDataUrl);

  return kind === "banner"
    ? spaces.updateBanner(token, spaceId, image)
    : spaces.updateImage(token, spaceId, image);
}

function readImageDataUrl(imageDataUrl: string) {
  const trimmed = imageDataUrl.trim();
  if (!IMAGE_DATA_URL.test(trimmed)) {
    throw new ApplicationError("Envie uma imagem JPG, PNG, GIF ou WebP.", 400);
  }

  if (imageByteLength(trimmed) > MAX_PROFILE_IMAGE_BYTES) {
    throw new ApplicationError("A imagem deve ter no máximo 2 MB.", 400);
  }

  return trimmed;
}

function imageByteLength(dataUrl: string): number {
  const payload = dataUrl.split(",")[1] ?? "";
  const padding = payload.endsWith("==") ? 2 : payload.endsWith("=") ? 1 : 0;
  return Math.floor((payload.length * 3) / 4) - padding;
}
