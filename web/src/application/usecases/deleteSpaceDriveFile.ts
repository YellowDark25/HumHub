import { ApplicationError } from "../errors";
import type { SpaceDriveRepository } from "../ports/SpaceDriveRepository";
import { requirePositiveId } from "./requirePositiveId";

/**
 * Exclui um arquivo gravado no drive do espaço.
 * Valida ids e pede ao repositório para apagar o registro e o binário.
 */
export function deleteSpaceDriveFile(
  drive: SpaceDriveRepository,
  token: string,
  spaceId: number,
  fileId: number,
) {
  return drive.deleteFile(
    token,
    requirePositiveId(spaceId, "Espaço inválido."),
    requirePositiveId(fileId, "Arquivo inválido."),
  );
}
