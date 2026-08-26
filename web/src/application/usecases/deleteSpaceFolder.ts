import { ApplicationError } from "../errors";
import type { SpaceDriveRepository } from "../ports/SpaceDriveRepository";

/**
 * Exclui uma pasta do drive e tudo que está dentro.
 * Recusa a raiz; o repositório apaga subpastas e arquivos em cascata.
 */
export function deleteSpaceFolder(
  drive: SpaceDriveRepository,
  token: string,
  spaceId: number,
  folderId: number,
) {
  if (!spaceId) {
    throw new ApplicationError("Espaço inválido.", 400);
  }

  if (!folderId) {
    throw new ApplicationError("Pasta inválida.", 400);
  }

  return drive.deleteFolder(token, spaceId, folderId);
}
