import { useEffect, useState } from "react";
import type { SpaceDrive } from "@/domain/SpaceDrive";
import { SPACE_DRIVE_ROOT_ID, asDriveList } from "@/domain/SpaceDrive";
import { readApiError } from "@/shared/readApiError";

/**
 * Carrega a pasta atual do drive e permite criar ou apagar pastas.
 * Chama as rotas /api/spaces/:id/drive; em sucesso recarrega a pasta.
 */
export function useSpaceDrive(spaceId: number, folderId: number) {
  const [drive, setDrive] = useState<SpaceDrive | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError("");

    void loadDrive(spaceId, folderId)
      .then((current) => {
        if (!cancelled) {
          setDrive(current);
        }
      })
      .catch((caught: unknown) => {
        if (!cancelled) {
          setError(
            caught instanceof Error
              ? caught.message
              : "Não foi possível carregar os arquivos.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [folderId, spaceId]);

  /**
   * Cria uma pasta na pasta atual e recarrega o drive.
   */
  async function createFolder(name: string) {
    setError("");
    setIsSaving(true);
    try {
      const response = await fetch(`/api/spaces/${spaceId}/drive/folders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, parentId: folderId }),
      });
      if (!response.ok) {
        setError(await readApiError(response, "Não foi possível criar a pasta."));
        return false;
      }

      setDrive(await loadDrive(spaceId, folderId));
      return true;
    } catch {
      setError("Falha de rede ao criar a pasta.");
      return false;
    } finally {
      setIsSaving(false);
    }
  }

  /**
   * Exclui a pasta e recarrega o conteúdo atual.
   */
  async function deleteFolder(targetId: number) {
    setError("");
    setIsSaving(true);
    try {
      const response = await fetch(
        `/api/spaces/${spaceId}/drive/folders/${targetId}`,
        { method: "DELETE" },
      );
      if (!response.ok) {
        setError(await readApiError(response, "Não foi possível excluir a pasta."));
        return false;
      }

      setDrive(await loadDrive(spaceId, folderId));
      return true;
    } catch {
      setError("Falha de rede ao excluir a pasta.");
      return false;
    } finally {
      setIsSaving(false);
    }
  }

  /**
   * Recarrega a pasta depois de um upload ou exclusão de arquivo.
   */
  async function reload() {
    try {
      setDrive(await loadDrive(spaceId, folderId));
    } catch (caught: unknown) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Não foi possível carregar os arquivos.",
      );
    }
  }

  return {
    drive,
    error,
    isLoading,
    isSaving,
    folderId: folderId > 0 ? folderId : SPACE_DRIVE_ROOT_ID,
    createFolder,
    deleteFolder,
    reload,
    setError,
  };
}

/**
 * Busca o conteúdo da pasta na API da intranet.
 * Normaliza caminho, pastas e arquivos para sempre serem arrays.
 */
async function loadDrive(spaceId: number, folderId: number): Promise<SpaceDrive> {
  const response = await fetch(
    `/api/spaces/${spaceId}/drive?folderId=${folderId > 0 ? folderId : 0}`,
  );
  if (!response.ok) {
    throw new Error(
      await readApiError(response, "Não foi possível carregar os arquivos."),
    );
  }

  const payload = (await response.json()) as Partial<SpaceDrive>;

  return {
    folderId: payload.folderId ?? SPACE_DRIVE_ROOT_ID,
    folderName: payload.folderName?.trim() || "Arquivos",
    ancestors: asDriveList(payload.ancestors),
    folders: asDriveList(payload.folders),
    files: asDriveList(payload.files),
  };
}
