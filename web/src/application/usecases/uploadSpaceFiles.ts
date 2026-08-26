import { SPACE_FILE_DESCRIPTION_MAX } from "@/shared/postComposer";
import { ApplicationError } from "../errors";
import type { FeedRepository } from "../ports/FeedRepository";
import { publishPost } from "./publishPost";

export function uploadSpaceFiles(
  feed: FeedRepository,
  token: string,
  spaceId: number,
  files: File[],
  description = "",
) {
  if (files.length === 0) {
    throw new ApplicationError("Selecione pelo menos um arquivo.", 400);
  }

  if (description.length > SPACE_FILE_DESCRIPTION_MAX) {
    throw new ApplicationError(
      `A descrição pode ter no máximo ${SPACE_FILE_DESCRIPTION_MAX} caracteres.`,
      400,
    );
  }

  return publishPost(feed, token, spaceId, description, files);
}
