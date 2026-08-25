import {
  POST_FILE_MAX_BYTES,
  POST_FILE_MAX_COUNT,
} from "@/shared/postComposer";
import { ApplicationError } from "../errors";
import type { FeedRepository } from "../ports/FeedRepository";

export function publishPost(
  feed: FeedRepository,
  token: string,
  spaceId: number,
  message: string,
  files: File[] = [],
) {
  const trimmed = message.trim();
  if (!trimmed && files.length === 0) {
    throw new ApplicationError("A publicação não pode ficar vazia.", 400);
  }

  if (!spaceId) {
    throw new ApplicationError("Selecione um espaço.", 400);
  }

  if (files.length > POST_FILE_MAX_COUNT) {
    throw new ApplicationError(
      `Você pode anexar no máximo ${POST_FILE_MAX_COUNT} arquivos.`,
      400,
    );
  }

  const oversized = files.find((file) => file.size > POST_FILE_MAX_BYTES);
  if (oversized) {
    throw new ApplicationError(
      `O arquivo ${oversized.name} ultrapassa o limite de ${POST_FILE_MAX_BYTES / (1024 * 1024)} MB.`,
      400,
    );
  }

  return feed.publishPost(token, spaceId, trimmed, files);
}
