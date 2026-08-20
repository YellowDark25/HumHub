import { ApplicationError } from "../errors";
import type { AuthRepository } from "../ports/AuthRepository";
import { MAX_PROFILE_IMAGE_BYTES } from "@/shared/profileImage";

const PROFILE_IMAGE_DATA_URL =
  /^data:image\/(jpeg|jpg|png|gif|webp);base64,/i;

export async function updateProfileImage(
  auth: AuthRepository,
  token: string,
  imageDataUrl: string,
) {
  const trimmed = imageDataUrl.trim();
  if (!PROFILE_IMAGE_DATA_URL.test(trimmed)) {
    throw new ApplicationError("Envie uma imagem JPG, PNG, GIF ou WebP.", 400);
  }

  if (imageByteLength(trimmed) > MAX_PROFILE_IMAGE_BYTES) {
    throw new ApplicationError("A imagem deve ter no máximo 2 MB.", 400);
  }

  const user = await auth.getCurrentUser(token);
  return auth.updateProfileImage(token, user.id, trimmed);
}

function imageByteLength(dataUrl: string): number {
  const payload = dataUrl.split(",")[1] ?? "";
  const padding = payload.endsWith("==") ? 2 : payload.endsWith("=") ? 1 : 0;
  return Math.floor((payload.length * 3) / 4) - padding;
}
