"use client";

import {
  homeUnreadConversationIds,
  listedConversations,
  unreadCountByWorkspace,
} from "@/application/usecases/assembleChatNavigation";
import type { ConversationLists } from "@/application/ports/ChatRepository";
import type { ChatWorkspace } from "@/domain/ChatWorkspace";
import type { Conversation } from "@/domain/Conversation";
import {
  unreadCountOf,
  type ConversationUnreadSnapshot,
} from "@/domain/ConversationUnread";
import { readApiError } from "@/shared/readApiError";
import {
  CHAT_SEEN_COUNT_KEY_PREFIX,
  CHAT_SEEN_MESSAGE_KEY_PREFIX,
  CHAT_UNREAD_POLL_MS,
} from "@/shared/chatUnread";
import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";

type SeenState = {
  messageId: number;
  count: number;
};

/**
 * Calcula não lidas por conversa e por servidor a partir das listas e do visto.
 * Lê o localStorage, marca a conversa aberta e consulta /api/chat/updates
 * para manter lastMessageId e messageCount atuais.
 */
export function useChatUnread(input: {
  lists: ConversationLists;
  workspaces: ChatWorkspace[];
  activeConversationId?: number;
}) {
  const conversations = useMemo(
    () => listedConversations(input.lists),
    [input.lists],
  );
  const [snapshots, setSnapshots] = useState(() =>
    snapshotsFromConversations(conversations),
  );
  const [seenByConversation, setSeenByConversation] = useState<
    Record<number, SeenState>
  >({});

  useEffect(() => {
    setSnapshots((current) =>
      mergeSnapshots(current, snapshotsFromConversations(conversations)),
    );
  }, [conversations]);

  useEffect(() => {
    setSeenByConversation((current) => seedFromSnapshots(current, snapshots));
  }, [snapshots]);

  useEffect(() => {
    if (!input.activeConversationId) {
      return;
    }

    const snapshot = snapshots[input.activeConversationId];
    if (!snapshot) {
      return;
    }

    markConversationSeen(
      input.activeConversationId,
      snapshot,
      setSeenByConversation,
    );
  }, [input.activeConversationId, snapshots]);

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      if (document.visibilityState === "hidden") {
        return;
      }

      try {
        const response = await fetch("/api/chat/updates");
        if (!response.ok) {
          console.error(
            await readApiError(response, "Não foi possível atualizar as não lidas."),
          );
          return;
        }

        const updates = (await response.json()) as ConversationUnreadSnapshot[];
        if (!cancelled) {
          setSnapshots((current) => mergeSnapshots(current, updates));
        }
      } catch (error) {
        console.error("Falha de rede ao atualizar as não lidas.", error);
      }
    }

    void refresh();
    const timer = window.setInterval(() => {
      void refresh();
    }, CHAT_UNREAD_POLL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  const unreadByConversation = useMemo(() => {
    const counts: Record<number, number> = {};
    const ids = new Set([
      ...conversations.map((conversation) => conversation.id),
      ...homeUnreadConversationIds(input.lists),
      ...Object.keys(snapshots).map(Number),
    ]);

    for (const conversationId of ids) {
      const listed = conversations.find((item) => item.id === conversationId);
      const snapshot = snapshots[conversationId] ?? {
        conversationId,
        lastMessageId: listed?.lastMessageId ?? 0,
        messageCount: listed?.messageCount ?? 0,
      };
      const seen = seenByConversation[conversationId] ?? {
        messageId: 0,
        count: 0,
      };
      counts[conversationId] =
        conversationId === input.activeConversationId
          ? 0
          : unreadCountOf({
              lastMessageId: snapshot.lastMessageId,
              messageCount: snapshot.messageCount,
              seenMessageId: seen.messageId,
              seenCount: seen.count,
            });
    }
    return counts;
  }, [
    conversations,
    snapshots,
    seenByConversation,
    input.activeConversationId,
    input.lists,
  ]);

  const unreadByWorkspace = useMemo(
    () =>
      unreadCountByWorkspace(
        input.lists,
        input.workspaces,
        unreadByConversation,
      ),
    [input.lists, input.workspaces, unreadByConversation],
  );

  return { unreadByConversation, unreadByWorkspace };
}

/**
 * Monta o mapa de instantâneos a partir das conversas já carregadas.
 */
function snapshotsFromConversations(
  conversations: Conversation[],
): Record<number, ConversationUnreadSnapshot> {
  const snapshots: Record<number, ConversationUnreadSnapshot> = {};
  for (const conversation of conversations) {
    snapshots[conversation.id] = {
      conversationId: conversation.id,
      lastMessageId: conversation.lastMessageId,
      messageCount: conversation.messageCount,
    };
  }
  return snapshots;
}

/**
 * Une instantâneos novos aos atuais, preservando o maior lastMessageId/total.
 */
function mergeSnapshots(
  current: Record<number, ConversationUnreadSnapshot>,
  incoming: Record<number, ConversationUnreadSnapshot> | ConversationUnreadSnapshot[],
): Record<number, ConversationUnreadSnapshot> {
  const next = { ...current };
  const items = Array.isArray(incoming) ? incoming : Object.values(incoming);

  for (const snapshot of items) {
    const previous = next[snapshot.conversationId];
    next[snapshot.conversationId] = {
      conversationId: snapshot.conversationId,
      lastMessageId: Math.max(
        previous?.lastMessageId ?? 0,
        snapshot.lastMessageId,
      ),
      messageCount: Math.max(previous?.messageCount ?? 0, snapshot.messageCount),
    };
  }

  return next;
}

/**
 * Completa o visto a partir dos instantâneos (bootstrap ou /updates).
 * Sem chave local, começa em zero para o badge aparecer até abrir a conversa.
 */
function seedFromSnapshots(
  current: Record<number, SeenState>,
  snapshots: Record<number, ConversationUnreadSnapshot>,
): Record<number, SeenState> {
  const next = { ...current };

  for (const snapshot of Object.values(snapshots)) {
    if (next[snapshot.conversationId]) {
      continue;
    }

    next[snapshot.conversationId] = readOrSeedSeen(snapshot);
  }

  return next;
}

/**
 * Devolve o visto gravado; sem chave, considera nada lido (id 0).
 * Assim o contador do servidor aparece até o usuário abrir cada conversa.
 */
function readOrSeedSeen(snapshot: ConversationUnreadSnapshot): SeenState {
  const storedMessageId = readStoredNumber(
    `${CHAT_SEEN_MESSAGE_KEY_PREFIX}${snapshot.conversationId}`,
  );
  const storedCount = readStoredNumber(
    `${CHAT_SEEN_COUNT_KEY_PREFIX}${snapshot.conversationId}`,
  );

  if (storedMessageId === null) {
    return { messageId: 0, count: 0 };
  }

  if (storedCount === null) {
    return {
      messageId: storedMessageId,
      count:
        snapshot.lastMessageId > storedMessageId ? 0 : snapshot.messageCount,
    };
  }

  return { messageId: storedMessageId, count: storedCount };
}

/**
 * Marca a conversa aberta como lida no estado e no localStorage.
 */
function markConversationSeen(
  conversationId: number,
  snapshot: ConversationUnreadSnapshot,
  setSeen: Dispatch<SetStateAction<Record<number, SeenState>>>,
) {
  const next = {
    messageId: snapshot.lastMessageId,
    count: snapshot.messageCount,
  };
  writeSeen(conversationId, next);
  setSeen((current) => {
    const previous = current[conversationId];
    if (
      previous &&
      previous.messageId >= next.messageId &&
      previous.count >= next.count
    ) {
      return current;
    }

    return { ...current, [conversationId]: next };
  });
}

function writeSeen(conversationId: number, seen: SeenState) {
  if (typeof window === "undefined") {
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
