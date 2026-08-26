import { normalizeFolderName } from "@/domain/SpaceDrive";
import { SPACE_DRIVE_ROOT_ID } from "@/domain/SpaceDrive";
import { ApplicationError } from "../errors";
import type { SpaceDriveRepository } from "../ports/SpaceDriveRepository";

/**
 * Cria uma pasta (ou subpasta) no drive do espaço.
 * Valida espaço e nome; pasta pai 0 é a raiz.
 */
export function createSpaceFolder(
  drive: SpaceDriveRepository,
  token: string,
  spaceId: number,
  parentId: number,
  name: string,
) {
  if (!spaceId) {
    throw new ApplicationError("Espaço inválido.", 400);
  }

  const folderName = normalizeFolderName(name);
  if (!folderName) {
    throw new ApplicationError("Informe o nome da pasta.", 400);
  }

  return drive.createFolder(
    token,
    spaceId,
    parentId > 0 ? parentId : SPACE_DRIVE_ROOT_ID,
    folderName,
  );
}
