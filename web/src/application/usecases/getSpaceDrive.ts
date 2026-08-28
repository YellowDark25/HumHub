import type { SpaceDrive } from "@/domain/SpaceDrive";
import { SPACE_DRIVE_ROOT_ID } from "@/domain/SpaceDrive";
import { ApplicationError } from "../errors";
import type { SpaceDriveRepository } from "../ports/SpaceDriveRepository";

/**
 * Abre uma pasta do drive do espaço.
 * Valida o espaço e devolve só o que foi enviado nesta seção (pastas e arquivos).
 */
export async function getSpaceDrive(
  drive: SpaceDriveRepository,
  token: string,
  spaceId: number,
  folderId = SPACE_DRIVE_ROOT_ID,
): Promise<SpaceDrive> {
  if (!spaceId) {
    throw new ApplicationError("Espaço inválido.", 400);
  }

  return drive.getDrive(token, spaceId, folderId);
}
