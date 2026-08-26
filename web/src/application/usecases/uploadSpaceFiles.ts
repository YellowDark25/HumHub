import { SPACE_DRIVE_ROOT_ID } from "@/domain/SpaceDrive";
import { SPACE_FILE_DESCRIPTION_MAX } from "@/shared/postComposer";
import { ApplicationError } from "../errors";
import type { SpaceDriveRepository } from "../ports/SpaceDriveRepository";

/**
 * Envia arquivos para a pasta atual do drive.
 * Valida seleção e descrição; pasta 0 grava na raiz.
 */
export function uploadSpaceFiles(
  drive: SpaceDriveRepository,
  token: string,
  spaceId: number,
  files: File[],
  description = "",
  folderId = SPACE_DRIVE_ROOT_ID,
) {
  if (!spaceId) {
    throw new ApplicationError("Espaço inválido.", 400);
  }

  if (files.length === 0) {
    throw new ApplicationError("Selecione pelo menos um arquivo.", 400);
  }

  if (description.length > SPACE_FILE_DESCRIPTION_MAX) {
    throw new ApplicationError(
      `A descrição pode ter no máximo ${SPACE_FILE_DESCRIPTION_MAX} caracteres.`,
      400,
    );
  }

  return drive.uploadFiles(
    token,
    spaceId,
    folderId > 0 ? folderId : SPACE_DRIVE_ROOT_ID,
    files,
    description,
  );
}
