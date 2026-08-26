import { ApplicationError } from "../errors";
import type { SpaceDriveRepository } from "../ports/SpaceDriveRepository";

/**
 * Baixa o conteúdo de um arquivo do drive.
 * Valida ids e devolve o binário com tipo e nome.
 */
export function getSpaceDriveFile(
  drive: SpaceDriveRepository,
  token: string,
  spaceId: number,
  fileId: number,
) {
  if (!spaceId || !fileId) {
    throw new ApplicationError("Arquivo inválido.", 400);
  }

  return drive.getFile(token, spaceId, fileId);
}
