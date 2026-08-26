import { ApplicationError } from "@/application/errors";
import type { SpaceDriveRepository } from "@/application/ports/SpaceDriveRepository";
import type { MediaFile } from "@/domain/MediaFile";
import type { SpaceDrive, SpaceFolder } from "@/domain/SpaceDrive";
import { SPACE_DRIVE_ROOT_ID } from "@/domain/SpaceDrive";
import type { SpaceFile } from "@/domain/SpaceFile";
import { getHumhubUrl } from "../config";
import { humhubRequest } from "../humhub/client";
import { mapSpaceDrive, mapSpaceDriveFile, mapSpaceFolder } from "./mappers";
import type { NexchatDriveFile, NexchatDriveResult } from "./types";

/**
 * Drive de arquivos do espaço via Nexchat.
 * Lista pastas, cria/apaga e sobe/baixa arquivos no módulo PHP.
 */
export class NexchatSpaceDriveRepository implements SpaceDriveRepository {
  /**
   * Abre a pasta pedida do espaço.
   * Chama GET /nexchat/space-drive e mapeia o conteúdo.
   */
  async getDrive(
    token: string,
    spaceId: number,
    folderId: number,
  ): Promise<SpaceDrive> {
    const dto = await humhubRequest<NexchatDriveResult>({
      path: `/nexchat/space-drive?spaceId=${spaceId}&folderId=${folderId}`,
      token,
      origin: "app",
    });
    assertDriveOk(dto);

    return mapSpaceDrive(dto, spaceId);
  }

  /**
   * Cria uma pasta na pasta pai.
   * POST /nexchat/space-drive/folder com nome e parentId.
   */
  async createFolder(
    token: string,
    spaceId: number,
    parentId: number,
    name: string,
  ): Promise<SpaceFolder> {
    const dto = await humhubRequest<NexchatDriveResult>({
      path: "/nexchat/space-drive/folder",
      token,
      origin: "app",
      method: "POST",
      body: { spaceId, parentId, name },
    });
    assertDriveOk(dto);
    if (!dto.folder) {
      throw new ApplicationError("Não foi possível criar a pasta.", 502);
    }

    return mapSpaceFolder(dto.folder);
  }

  /**
   * Apaga a pasta e o conteúdo interno.
   */
  async deleteFolder(
    token: string,
    spaceId: number,
    folderId: number,
  ): Promise<void> {
    const dto = await humhubRequest<NexchatDriveResult>({
      path: "/nexchat/space-drive/delete-folder",
      token,
      origin: "app",
      method: "POST",
      body: { spaceId, folderId },
    });
    assertDriveOk(dto);
  }

  /**
   * Envia os arquivos para a pasta atual.
   * Monta FormData e chama POST /nexchat/space-drive/upload.
   */
  async uploadFiles(
    token: string,
    spaceId: number,
    folderId: number,
    files: File[],
    description: string,
  ): Promise<SpaceFile[]> {
    const body = new FormData();
    body.append("spaceId", String(spaceId));
    body.append("folderId", String(folderId > 0 ? folderId : SPACE_DRIVE_ROOT_ID));
    body.append("description", description);
    for (const file of files) {
      body.append("files", file);
    }

    const dto = await humhubRequest<NexchatDriveResult>({
      path: "/nexchat/space-drive/upload",
      token,
      origin: "app",
      method: "POST",
      body,
    });
    assertDriveOk(dto);

    return (dto.files ?? []).map((file: NexchatDriveFile) =>
      mapSpaceDriveFile(file, spaceId),
    );
  }

  /**
   * Remove um arquivo do drive.
   */
  async deleteFile(
    token: string,
    spaceId: number,
    fileId: number,
  ): Promise<void> {
    const dto = await humhubRequest<NexchatDriveResult>({
      path: "/nexchat/space-drive/delete-file",
      token,
      origin: "app",
      method: "POST",
      body: { spaceId, fileId },
    });
    assertDriveOk(dto);
  }

  /**
   * Baixa o binário do arquivo no HumHub.
   */
  async getFile(
    token: string,
    spaceId: number,
    fileId: number,
  ): Promise<MediaFile> {
    const response = await fetch(
      `${getHumhubUrl()}/nexchat/space-drive/file?spaceId=${spaceId}&id=${fileId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      },
    );
    if (!response.ok) {
      throw new ApplicationError(
        "Não foi possível baixar o arquivo.",
        response.status,
      );
    }

    return {
      body: await response.arrayBuffer(),
      contentType: response.headers.get("content-type") || "application/octet-stream",
    };
  }
}

/**
 * Converte resposta sem success em ApplicationError.
 * Lê message/error do Nexchat.
 */
function assertDriveOk(dto: NexchatDriveResult) {
  if (dto.success === false) {
    throw new ApplicationError(
      dto.message || dto.error || "Não foi possível atualizar os arquivos.",
      400,
    );
  }
}
