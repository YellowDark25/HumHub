/**
 * Arquivo publicado num espaço (anexo de uma publicação).
 * Serve a lista de Arquivos: metadados para download e se o usuário
 * autenticado pode excluir (autor da publicação ou gestor do espaço).
 */
export type SpaceFile = {
  id: number;
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
