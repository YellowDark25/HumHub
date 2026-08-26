export const SPACE_SECTIONS = [
  { id: "stream", label: "Stream" },
  { id: "membros", label: "Membros" },
  { id: "arquivos", label: "Arquivos" },
  { id: "tarefas", label: "Tarefas" },
] as const;

export type SpaceSectionId = (typeof SPACE_SECTIONS)[number]["id"];

export function readSpaceSection(
  searchParams: Record<string, string | string[] | undefined>,
): SpaceSectionId {
  const raw = Array.isArray(searchParams.secao)
    ? searchParams.secao[0]
    : searchParams.secao;

  return SPACE_SECTIONS.some((section) => section.id === raw)
    ? (raw as SpaceSectionId)
    : "stream";
}

export function spaceSectionHref(spaceId: number, sectionId: SpaceSectionId) {
  if (sectionId === "stream") {
    return `/espacos/${spaceId}`;
  }

  return `/espacos/${spaceId}?secao=${sectionId}`;
}

/**
 * Lê o id da pasta do drive na query `pasta`.
 * Ausente ou inválido volta para a raiz (0).
 */
export function readSpaceFolderId(
  searchParams: Record<string, string | string[] | undefined>,
): number {
  const raw = Array.isArray(searchParams.pasta)
    ? searchParams.pasta[0]
    : searchParams.pasta;
  const folderId = Number(raw);

  return Number.isFinite(folderId) && folderId > 0 ? folderId : 0;
}

/**
 * Monta a URL da seção Arquivos numa pasta do drive.
 */
export function spaceDriveHref(spaceId: number, folderId = 0) {
  if (folderId <= 0) {
    return spaceSectionHref(spaceId, "arquivos");
  }

  return `/espacos/${spaceId}?secao=arquivos&pasta=${folderId}`;
}
