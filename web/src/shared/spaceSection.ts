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
