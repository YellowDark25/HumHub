export const PROFILE_SECTIONS = [
  { id: "stream", label: "Stream" },
  { id: "sobre", label: "Sobre" },
  { id: "convites", label: "Convites" },
  { id: "arquivos", label: "Arquivos" },
  { id: "tarefas", label: "Tarefas" },
  { id: "wiki", label: "Wiki" },
] as const;

export type ProfileSectionId = (typeof PROFILE_SECTIONS)[number]["id"];

export function readProfileSection(
  searchParams: Record<string, string | string[] | undefined>,
): ProfileSectionId {
  const raw = Array.isArray(searchParams.secao)
    ? searchParams.secao[0]
    : searchParams.secao;

  return PROFILE_SECTIONS.some((section) => section.id === raw)
    ? (raw as ProfileSectionId)
    : "stream";
}

export function profileSectionHref(sectionId: ProfileSectionId): string {
  if (sectionId === "stream") {
    return "/perfil";
  }

  return `/perfil?secao=${sectionId}`;
}
