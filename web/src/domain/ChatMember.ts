/** Presenças que o roster do canal sabe agrupar. */
export const CHAT_MEMBER_STATUSES = ["voice", "online", "offline"] as const;

/** Status de presença de um membro na lista lateral. */
export type ChatMemberStatus = (typeof CHAT_MEMBER_STATUSES)[number];

/** Membro do canal na lista lateral, com foto e se está online. */
export type ChatMember = {
  userId: number;
  name: string;
  username: string;
  imageUrl: string;
  title: string;
  isAdmin: boolean;
  isOnline: boolean;
};

/** Fatia do roster já agrupada por um status. */
export type ChatMemberGroup = {
  status: ChatMemberStatus;
  title: string;
  members: ChatMember[];
};

/**
 * Agrupa os membros do canal pela presença que a intranet conhece.
 * Quem está em voz sai na frente; o restante vai para Online ou Offline.
 * @returns só os grupos que têm alguém, já ordenados por nome.
 */
export function groupChatMembers(
  members: ChatMember[],
  voiceUserIds: ReadonlySet<number>,
): ChatMemberGroup[] {
  const groups: Record<ChatMemberStatus, ChatMember[]> = {
    voice: [],
    online: [],
    offline: [],
  };

  for (const member of sortMembersByName(members)) {
    groups[memberStatus(member, voiceUserIds)].push(member);
  }

  return CHAT_MEMBER_STATUSES.filter((status) => groups[status].length > 0).map(
    (status) => ({
      status,
      title: memberGroupTitle(status, groups[status].length),
      members: groups[status],
    }),
  );
}

/**
 * Marca o usuário autenticado como online no roster.
 * O HumHub usa last_login; a sessão atual ainda pode parecer offline.
 */
export function markSelfOnline(
  members: ChatMember[],
  currentUserId: number,
): ChatMember[] {
  if (!currentUserId) {
    return members;
  }

  return members.map((member) =>
    member.userId === currentUserId ? { ...member, isOnline: true } : member,
  );
}

function memberStatus(
  member: ChatMember,
  voiceUserIds: ReadonlySet<number>,
): ChatMemberStatus {
  if (voiceUserIds.has(member.userId)) {
    return "voice";
  }

  return member.isOnline ? "online" : "offline";
}

function memberGroupTitle(status: ChatMemberStatus, count: number): string {
  if (status === "voice") {
    return `Em voz — ${count}`;
  }

  if (status === "online") {
    return `Online — ${count}`;
  }

  return `Offline — ${count}`;
}

function sortMembersByName(members: ChatMember[]): ChatMember[] {
  return [...members].sort((left, right) =>
    left.name.localeCompare(right.name, "pt"),
  );
}
