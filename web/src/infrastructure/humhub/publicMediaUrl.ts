import { PROFILE_IMAGE_FOLDER, SPACE_BANNER_FOLDER } from "./constants";

const MEDIA_PREFIX = "/api/media";

export function toBrowserMediaUrl(imageUrl?: string): string {
  const trimmed = imageUrl?.trim() ?? "";
  if (!trimmed) {
    return "";
  }

  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    return `${MEDIA_PREFIX}${trimmed.startsWith("/") ? trimmed : `/${trimmed}`}`;
  }

  try {
    const parsed = new URL(trimmed);
    return `${MEDIA_PREFIX}${parsed.pathname}${parsed.search}`;
  } catch {
    return trimmed;
  }
}

export function mediaUrlFromGuid(guid: string): string {
  const trimmed = guid.trim();
  if (!trimmed) {
    return "";
  }

  return `${MEDIA_PREFIX}/${PROFILE_IMAGE_FOLDER}/${trimmed}.jpg`;
}

export function bannerMediaUrlFromGuid(guid: string): string {
  const trimmed = guid.trim();
  if (!trimmed) {
    return "";
  }

  return `${MEDIA_PREFIX}/${SPACE_BANNER_FOLDER}/${trimmed}_org.jpg`;
}
