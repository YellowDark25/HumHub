export const ADMIN_SECTIONS = [
  { id: "usuarios", href: "/administracao/usuarios", label: "Usuários" },
  { id: "paginas", href: "/administracao/paginas", label: "Páginas Personalizadas" },
  { id: "espacos", href: "/administracao/espacos", label: "Espaços" },
  { id: "modulos", href: "/administracao/modulos", label: "Módulos" },
  { id: "configuracoes", href: "/administracao/configuracoes", label: "Configurações" },
  { id: "informacao", href: "/administracao/informacao", label: "Informação" },
] as const;

export type AdminSectionId = (typeof ADMIN_SECTIONS)[number]["id"];

export const ADMIN_USER_TABS = [
  { id: "visao", label: "Visão Global" },
  { id: "configuracoes", label: "Configurações" },
  { id: "perfis", label: "Perfis" },
  { id: "grupos", label: "Grupos" },
  { id: "pessoas", label: "Pessoas" },
] as const;

export type AdminUserTabId = (typeof ADMIN_USER_TABS)[number]["id"];

export const ADMIN_SPACE_TABS = [
  { id: "visao", label: "Visão Global" },
  { id: "configuracoes", label: "Configurações" },
  { id: "permissoes", label: "Permissões" },
] as const;

export type AdminSpaceTabId = (typeof ADMIN_SPACE_TABS)[number]["id"];

export const ADMIN_PAGE_TABS = [
  { id: "visao", label: "Visão Global" },
  { id: "snippets", label: "Snippets" },
  { id: "templates", label: "Templates" },
  { id: "configuracoes", label: "Configurações" },
] as const;

export type AdminPageTabId = (typeof ADMIN_PAGE_TABS)[number]["id"];

export const ADMIN_SETTING_TABS = [
  { id: "geral", label: "Geral" },
  { id: "aparencia", label: "Aparência" },
  { id: "notificacoes", label: "Notificações" },
  { id: "topicos", label: "Tópicos" },
  { id: "avancado", label: "Avançado" },
] as const;

export type AdminSettingTabId = (typeof ADMIN_SETTING_TABS)[number]["id"];

export const ADMIN_INFO_TABS = [
  { id: "sobre", label: "Sobre o NexHub" },
  { id: "pre-requisitos", label: "Pré-requisitos" },
  { id: "banco", label: "Banco de dados" },
  { id: "tarefas", label: "Trabalhos em segundo plano" },
  { id: "logs", label: "Registros de Log" },
] as const;

export type AdminInfoTabId = (typeof ADMIN_INFO_TABS)[number]["id"];

export function readAdminUserTab(
  searchParams: Record<string, string | string[] | undefined>,
): AdminUserTabId {
  return readOption(searchParams.aba, ADMIN_USER_TABS, "visao");
}

export function readAdminSpaceTab(
  searchParams: Record<string, string | string[] | undefined>,
): AdminSpaceTabId {
  return readOption(searchParams.aba, ADMIN_SPACE_TABS, "visao");
}

export function readAdminPageTab(
  searchParams: Record<string, string | string[] | undefined>,
): AdminPageTabId {
  return readOption(searchParams.aba, ADMIN_PAGE_TABS, "visao");
}

export function readAdminSettingTab(
  searchParams: Record<string, string | string[] | undefined>,
): AdminSettingTabId {
  return readOption(searchParams.aba, ADMIN_SETTING_TABS, "geral");
}

export function readAdminInfoTab(
  searchParams: Record<string, string | string[] | undefined>,
): AdminInfoTabId {
  return readOption(searchParams.aba, ADMIN_INFO_TABS, "sobre");
}

export function adminUserTabHref(tabId: AdminUserTabId) {
  return tabHref("/administracao/usuarios", tabId, "visao");
}

export function adminSpaceTabHref(tabId: AdminSpaceTabId) {
  return tabHref("/administracao/espacos", tabId, "visao");
}

export function adminPageTabHref(tabId: AdminPageTabId) {
  return tabHref("/administracao/paginas", tabId, "visao");
}

export function adminSettingTabHref(tabId: AdminSettingTabId) {
  return tabHref("/administracao/configuracoes", tabId, "geral");
}

export function adminInfoTabHref(tabId: AdminInfoTabId) {
  return tabHref("/administracao/informacao", tabId, "sobre");
}

function tabHref(base: string, tabId: string, defaultId: string) {
  if (tabId === defaultId) {
    return base;
  }

  return `${base}?aba=${tabId}`;
}

function readOption<T extends { id: string }>(
  raw: string | string[] | undefined,
  options: readonly T[],
  fallback: T["id"],
): T["id"] {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return options.some((option) => option.id === value)
    ? (value as T["id"])
    : fallback;
}
