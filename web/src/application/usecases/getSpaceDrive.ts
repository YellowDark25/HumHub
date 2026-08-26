import type { SpaceDrive } from "@/domain/SpaceDrive";
import {
  SPACE_DRIVE_ROOT_ID,
  asDriveList,
  isSpaceDriveRoot,
} from "@/domain/SpaceDrive";
import type { SpaceFile } from "@/domain/SpaceFile";
import { ApplicationError } from "../errors";
import type { FeedRepository } from "../ports/FeedRepository";
import type { SpaceDriveRepository } from "../ports/SpaceDriveRepository";
import { spaceFilesFromPosts } from "./listSpaceFiles";

/**
 * Abre uma pasta do drive do espaço.
 * Lê a pasta no repositório; na raiz, junta os anexos antigos do feed.
 */
export async function getSpaceDrive(
  drive: SpaceDriveRepository,
  feed: FeedRepository,
  token: string,
  spaceId: number,
  folderId = SPACE_DRIVE_ROOT_ID,
): Promise<SpaceDrive> {
  if (!spaceId) {
    throw new ApplicationError("Espaço inválido.", 400);
  }

  const current = await drive.getDrive(token, spaceId, folderId);
  if (!isSpaceDriveRoot(current.folderId)) {
    return current;
  }

  return {
    ...current,
    files: mergeRootFiles(
      asDriveList(current.files),
      spaceFilesFromPosts(await feed.listPosts(token, spaceId)),
    ),
  };
}

/**
 * Une arquivos do drive com anexos do feed, sem repetir o mesmo id+origem.
 */
function mergeRootFiles(driveFiles: SpaceFile[], feedFiles: SpaceFile[]): SpaceFile[] {
  const currentFiles = asDriveList(driveFiles);
  const seen = new Set(currentFiles.map((file) => `${file.origin}:${file.id}`));
  const extra = asDriveList(feedFiles).filter(
    (file) => !seen.has(`${file.origin}:${file.id}`),
  );
  return [...currentFiles, ...extra].sort((left, right) =>
    (right.publishedAt ?? "").localeCompare(left.publishedAt ?? ""),
  );
}
