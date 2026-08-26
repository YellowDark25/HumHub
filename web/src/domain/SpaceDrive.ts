import type { SpaceFile } from "./SpaceFile";

export const SPACE_DRIVE_ROOT_ID = 0;
export const SPACE_FOLDER_NAME_MAX = 80;
export const SPACE_FOLDER_DEPTH_MAX = 8;

/** Pasta do drive do espaço (raiz usa id 0). */
export type SpaceFolder = {
  id: number;
  name: string;
  parentId: number;
  authorName: string;
  createdAt: string | null;
  canDelete: boolean;
};

/** Passo do caminho até a pasta atual. */
export type SpaceDriveAncestor = {
  id: number;
  name: string;
};

/** Conteúdo de uma pasta do drive: caminho, subpastas e arquivos. */
export type SpaceDrive = {
  folderId: number;
  folderName: string;
  ancestors: SpaceDriveAncestor[];
  folders: SpaceFolder[];
  files: SpaceFile[];
};

/**
 * Diz se o id aponta para a raiz do drive.
 * Zero ou valor inválido caem na raiz.
 */
export function isSpaceDriveRoot(folderId: number) {
  return !Number.isFinite(folderId) || folderId <= SPACE_DRIVE_ROOT_ID;
}

/**
 * Normaliza o nome da pasta: corta espaços e limita o tamanho.
 */
export function normalizeFolderName(name: string) {
  return name.trim().replace(/\s+/g, " ").slice(0, SPACE_FOLDER_NAME_MAX);
}

/**
 * Devolve o valor se for array; senão lista vazia.
 * O JSON do drive às vezes omite pastas/arquivos — sem isso o roster lê `.length` de undefined.
 */
export function asDriveList<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : [];
}
