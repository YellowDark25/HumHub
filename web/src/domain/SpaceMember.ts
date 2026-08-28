import type { User } from "./User";

/**
 * Membro de um espaço e o cargo interno (owner, admin, moderator, member).
 * O cargo em inglês fica para permissão; a tela usa spaceMemberRoleLabel.
 */
export type SpaceMember = {
  user: User;
  role: string;
};

const SPACE_MEMBER_ROLE_LABELS: Record<string, string> = {
  owner: "Proprietário",
  admin: "Administrador",
  moderator: "Moderador",
  member: "Membro",
  user: "Membro",
  guest: "Convidado",
};

/**
 * Traduz o cargo do espaço para o rótulo em português.
 * Lê owner/admin/moderator/member; valor desconhecido aparece como veio.
 */
export function spaceMemberRoleLabel(role: string): string {
  const key = role.trim().toLowerCase();
  return SPACE_MEMBER_ROLE_LABELS[key] ?? role.trim();
}
