/**
 * Arquivo do drive do espaço (ou anexo antigo vindo do feed).
 * `origin` separa o que está na pasta do que ainda veio de uma publicação.
 */
export type SpaceFileOrigin = "drive" | "feed";

export type SpaceFile = {
  id: number;
  folderId: number;
  origin: SpaceFileOrigin;
  name: string;
  url: string;
  mime: string;
  sizeBytes: number;
  isImage: boolean;
  isAudio: boolean;
  description: string;
  authorName: string;
  publishedAt: string | null;
  canDelete: boolean;
};
