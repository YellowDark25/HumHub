export const ACCOUNT_SECTIONS = [
  { id: "perfil", label: "Perfil" },
  { id: "emails", label: "E-mails de resumo" },
  { id: "notificacoes", label: "Notificações" },
  { id: "geral", label: "Geral" },
  { id: "modulos", label: "Módulos" },
] as const;

export type AccountSectionId = (typeof ACCOUNT_SECTIONS)[number]["id"];

export const ACCOUNT_PROFILE_TABS = [
  { id: "perfil", label: "Perfil" },
  { id: "usuario", label: "Alterar nome de usuário" },
  { id: "email", label: "Alterar email" },
  { id: "senha", label: "Alterar senha" },
  { id: "apagar", label: "Apagar Conta" },
] as const;

export type AccountProfileTabId = (typeof ACCOUNT_PROFILE_TABS)[number]["id"];

export function readAccountSection(
  searchParams: Record<string, string | string[] | undefined>,
): AccountSectionId {
  return readOption(searchParams.secao, ACCOUNT_SECTIONS, "perfil");
}

export function readAccountProfileTab(
  searchParams: Record<string, string | string[] | undefined>,
): AccountProfileTabId {
  return readOption(searchParams.aba, ACCOUNT_PROFILE_TABS, "perfil");
}

export function accountSectionHref(sectionId: AccountSectionId): string {
  if (sectionId === "perfil") {
    return "/configuracoes";
  }

  return `/configuracoes?secao=${sectionId}`;
}

export function accountProfileTabHref(tabId: AccountProfileTabId): string {
  if (tabId === "perfil") {
    return "/configuracoes";
  }

  return `/configuracoes?secao=perfil&aba=${tabId}`;
}

function readOption<T extends { id: string }>(
  raw: string | string[] | undefined,
  options: readonly T[],
  fallback: T["id"],
): T["id"] {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return options.some((option) => option.id === value) ? (value as T["id"]) : fallback;
}
