import { ApplicationError } from "../errors";
import type { MediaRepository } from "../ports/MediaRepository";

const ALLOWED_PREFIXES = [
  "uploads/",
  "file/",
  "static/",
  "themes/",
  "assets/",
];

export function getHumhubMedia(
  media: MediaRepository,
  token: string,
  path: string,
  search = "",
) {
  if (!token) {
    throw new ApplicationError("Não autenticado.", 401);
  }

  return media.getPublicFile(readSafeMediaPath(path), search, token);
}

function readSafeMediaPath(path: string): string {
  const trimmed = path.trim().replace(/^\/+/, "");
  if (!trimmed || trimmed.includes("..") || trimmed.includes("://")) {
    throw new ApplicationError("Arquivo inválido.", 400);
  }

  if (!ALLOWED_PREFIXES.some((prefix) => trimmed.startsWith(prefix))) {
    throw new ApplicationError("Arquivo inválido.", 400);
  }

  return trimmed;
}
