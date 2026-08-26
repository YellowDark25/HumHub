import type { SpaceMember } from "@/domain/SpaceMember";
import type { User } from "@/domain/User";

const SPACE_MANAGER_ROLES = new Set(["admin", "owner"]);

/**
 * Diz se o usuário pode administrar o espaço.
 * Admin global sempre pode; senão precisa ser owner ou admin na lista de membros.
 * @returns true quando o usuário pode gerir o espaço.
 */
export function canManageSpace(user: User, members: SpaceMember[]) {
  if (user.isAdmin) {
    return true;
  }

  const membership = members.find((member) => member.user.id === user.id);
  return SPACE_MANAGER_ROLES.has(membership?.role ?? "");
}
