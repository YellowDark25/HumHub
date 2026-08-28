import {
  isPostImageFile,
  POST_FILE_MAX_BYTES,
  POST_FILE_MAX_COUNT,
} from "@/shared/postComposer";
import { ApplicationError } from "../errors";
import type { FeedRepository } from "../ports/FeedRepository";

/**
 * Publica no feed do espaço com texto e, se houver, só JPEG, JPG ou PNG.
 * Valida espaço, mensagem (ou anexo), quantidade, tamanho e tipo; grava pelo feed.
 */
export function publishPost(
  feed: FeedRepository,
  token: string,
  spaceId: number,
  message: string,
  files: File[] = [],
) {
  const trimmed = readPostMessage(message, files);

  if (!spaceId) {
    throw new ApplicationError("Selecione um espaço.", 400);
  }

  if (files.length > POST_FILE_MAX_COUNT) {
    throw new ApplicationError(
      `Você pode anexar no máximo ${POST_FILE_MAX_COUNT} arquivos.`,
      400,
    );
  }

  const notImage = files.find((file) => !isPostImageFile(file));
  if (notImage) {
    throw new ApplicationError(
      "Só é possível anexar imagens JPEG, JPG ou PNG.",
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

/**
 * Normaliza o texto da publicação.
 * Usa a mensagem se houver; senão, os nomes dos anexos; vazio sem anexo é erro.
 */
function readPostMessage(message: string, files: File[]) {
  const trimmed = message.trim();
  if (trimmed) {
    return trimmed;
  }

  if (files.length === 0) {
    throw new ApplicationError("A publicação não pode ficar vazia.", 400);
  }

  return files.map((file) => file.name).join(", ");
}
