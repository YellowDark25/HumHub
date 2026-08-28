/**
 * Arquivo gravado no drive do espaço pela seção Arquivos.
 * `origin` marca a pasta do drive; o valor `feed` fica só para exclusão antiga.
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
  authorImageUrl: string;
  publishedAt: string | null;
  canDelete: boolean;
};
