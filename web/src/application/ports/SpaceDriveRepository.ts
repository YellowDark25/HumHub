import type { SpaceDrive, SpaceFolder } from "@/domain/SpaceDrive";
import type { SpaceFile } from "@/domain/SpaceFile";
import type { MediaFile } from "@/domain/MediaFile";

/**
 * Porta do drive de arquivos do espaço.
 * Lista pasta, cria/apaga pastas e envia/baixa/exclui arquivos.
 */
export interface SpaceDriveRepository {
  getDrive(
    token: string,
    spaceId: number,
    folderId: number,
  ): Promise<SpaceDrive>;
  createFolder(
    token: string,
    spaceId: number,
    parentId: number,
    name: string,
  ): Promise<SpaceFolder>;
  deleteFolder(token: string, spaceId: number, folderId: number): Promise<void>;
  uploadFiles(
    token: string,
    spaceId: number,
    folderId: number,
    files: File[],
    description: string,
  ): Promise<SpaceFile[]>;
  deleteFile(token: string, spaceId: number, fileId: number): Promise<void>;
  getFile(token: string, spaceId: number, fileId: number): Promise<MediaFile>;
}
