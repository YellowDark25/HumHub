import type { Post } from "@/domain/Post";
import type { SpaceFile } from "@/domain/SpaceFile";
import { ApplicationError } from "../errors";
import type { FeedRepository } from "../ports/FeedRepository";

/** Quem está vendo a lista, para marcar `canDelete` em cada arquivo. */
type SpaceFileActor = {
  userId: number;
  canManage: boolean;
};

/**
 * Lista os arquivos publicados no espaço.
 * Lê as publicações do feed, extrai anexos e marca quais o ator pode excluir.
 * @returns arquivos do espaço, do mais recente ao mais antigo.
 */
export async function listSpaceFiles(
  feed: FeedRepository,
  token: string,
  spaceId: number,
  actor?: SpaceFileActor,
): Promise<SpaceFile[]> {
  if (!spaceId) {
    throw new ApplicationError("Espaço inválido.", 400);
  }

  return spaceFilesFromPosts(await feed.listPosts(token, spaceId), actor);
}

/**
 * Converte publicações do espaço na lista de arquivos da seção Arquivos.
 * Percorre anexos, descarta duplicatas e define `canDelete` com o ator
 * (gestor ou autor da publicação).
 */
export function spaceFilesFromPosts(
  posts: Post[],
  actor?: SpaceFileActor,
): SpaceFile[] {
  const files = new Map<number, SpaceFile>();

  for (const post of posts) {
    for (const attachment of post.attachments) {
      if (files.has(attachment.id)) {
        continue;
      }

      files.set(attachment.id, {
        id: attachment.id,
        name: attachment.name,
        url: attachment.url,
        mime: attachment.mime,
        sizeBytes: attachment.sizeBytes,
        isImage: attachment.isImage,
        isAudio: attachment.isAudio,
        description: fileDescription(post.message, post.attachments),
        authorName: post.authorName,
        publishedAt: post.publishedAt,
        canDelete: canDeleteSpaceFile(post, actor),
      });
    }
  }

  return [...files.values()].sort((left, right) =>
    (right.publishedAt ?? "").localeCompare(left.publishedAt ?? ""),
  );
}

/**
 * Monta a descrição visível do arquivo a partir da mensagem da publicação.
 * Se a mensagem for só os nomes dos anexos (fallback do envio), devolve vazio.
 */
function fileDescription(message: string, attachments: Post["attachments"]) {
  const description = message.trim();
  if (!description) {
    return "";
  }

  const fallback = attachments.map((file) => file.name).join(", ");
  return description === fallback ? "" : description;
}

/**
 * Diz se o ator pode excluir o arquivo desta publicação.
 * Gestor do espaço pode qualquer um; membro comum só os que publicou.
 */
function canDeleteSpaceFile(post: Post, actor?: SpaceFileActor) {
  if (!actor) {
    return false;
  }

  return actor.canManage || post.authorId === actor.userId;
}
