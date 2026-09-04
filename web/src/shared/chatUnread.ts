export const CHAT_UNREAD_POLL_MS = 8_000;
export const CHAT_SEEN_MESSAGE_KEY_PREFIX = "nexhub_chat_seen_";
export const CHAT_SEEN_COUNT_KEY_PREFIX = "nexhub_chat_seen_count_";

export type ChatSeenState = {
  messageId: number;
  count: number;
};

/**
 * Lê o visto gravado de uma conversa no localStorage.
 * Sem chave ou fora do browser devolve null — ainda não há visto conhecido.
 */
export function readStoredSeen(conversationId: number): ChatSeenState | null {
  const messageId = readStoredNumber(
    `${CHAT_SEEN_MESSAGE_KEY_PREFIX}${conversationId}`,
  );
  if (messageId === null) {
    return null;
  }

  return {
    messageId,
    count:
      readStoredNumber(`${CHAT_SEEN_COUNT_KEY_PREFIX}${conversationId}`) ?? 0,
  };
}

/**
 * Lê todos os vistos gravados neste browser.
 * Percorre as chaves nexhub_chat_seen_*; usado no primeiro paint do cliente.
 */
export function readAllStoredSeen(): Record<number, ChatSeenState> {
  if (typeof window === "undefined") {
    return {};
  }

  const seen: Record<number, ChatSeenState> = {};
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (!key?.startsWith(CHAT_SEEN_MESSAGE_KEY_PREFIX)) {
      continue;
    }

    const conversationId = Number(
      key.slice(CHAT_SEEN_MESSAGE_KEY_PREFIX.length),
    );
    if (!Number.isFinite(conversationId) || conversationId <= 0) {
      continue;
    }

    const stored = readStoredSeen(conversationId);
    if (stored) {
      seen[conversationId] = stored;
    }
  }

  return seen;
}

/**
 * Grava o visto da conversa. Ignora instantâneo vazio para não apagar um visto real.
 */
export function writeStoredSeen(conversationId: number, seen: ChatSeenState) {
  if (typeof window === "undefined") {
    return;
  }

  if (seen.messageId <= 0 && seen.count <= 0) {
    return;
  }

  window.localStorage.setItem(
    `${CHAT_SEEN_MESSAGE_KEY_PREFIX}${conversationId}`,
    String(seen.messageId),
  );
  window.localStorage.setItem(
    `${CHAT_SEEN_COUNT_KEY_PREFIX}${conversationId}`,
    String(seen.count),
  );
}

function readStoredNumber(key: string): number | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(key);
  if (raw === null || raw === "") {
    return null;
  }

  const value = Number.parseInt(raw, 10);
  return Number.isFinite(value) ? value : null;
}
