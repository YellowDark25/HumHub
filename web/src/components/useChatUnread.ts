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
  CHAT_UNREAD_POLL_MS,
  readAllStoredSeen,
  writeStoredSeen,
  type ChatSeenState,
} from "@/shared/chatUnread";
import { useEffect, useMemo, useState } from "react";

/**
 * Calcula não lidas por conversa e por servidor a partir das listas e do visto.
 * Só mostra badges depois de ler o localStorage; marca a conversa aberta
 * quando já há lastMessageId e consulta /api/chat/updates.
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
    Record<number, ChatSeenState>
  >({});
  const [hasLoadedSeen, setHasLoadedSeen] = useState(false);

  useEffect(() => {
    setSnapshots((current) =>
      mergeSnapshots(current, snapshotsFromConversations(conversations)),
    );
  }, [conversations]);

  useEffect(() => {
    setSeenByConversation((current) => ({
      ...readAllStoredSeen(),
      ...current,
    }));
    setHasLoadedSeen(true);
  }, []);

  useEffect(() => {
    if (!input.activeConversationId) {
      return;
    }

    const snapshot = snapshots[input.activeConversationId];
    if (!snapshot || (snapshot.lastMessageId <= 0 && snapshot.messageCount <= 0)) {
      return;
    }

    setSeenByConversation((current) =>
      markConversationSeen(current, input.activeConversationId, snapshot),
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
            await readApiError(
              response,
              "Não foi possível atualizar as não lidas.",
            ),
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
      const seen = seenByConversation[conversationId];
      counts[conversationId] =
        !hasLoadedSeen || conversationId === input.activeConversationId
          ? 0
          : unreadCountOf({
              lastMessageId: snapshot.lastMessageId,
              messageCount: snapshot.messageCount,
              seenMessageId: seen?.messageId ?? 0,
              seenCount: seen?.count ?? 0,
            });
    }
    return counts;
  }, [
    conversations,
    snapshots,
    seenByConversation,
    hasLoadedSeen,
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
  incoming:
    | Record<number, ConversationUnreadSnapshot>
    | ConversationUnreadSnapshot[],
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
 * Marca a conversa como lida no mapa e no localStorage.
 * Não grava 0/0 — isso apagaria um visto real no hard reload.
 */
function markConversationSeen(
  current: Record<number, ChatSeenState>,
  conversationId: number,
  snapshot: ConversationUnreadSnapshot,
): Record<number, ChatSeenState> {
  const previous = current[conversationId];
  const next = {
    messageId: Math.max(previous?.messageId ?? 0, snapshot.lastMessageId),
    count: Math.max(previous?.count ?? 0, snapshot.messageCount),
  };

  if (next.messageId <= 0 && next.count <= 0) {
    return current;
  }

  if (
    previous &&
    previous.messageId >= next.messageId &&
    previous.count >= next.count
  ) {
    return current;
  }

  writeStoredSeen(conversationId, next);
  return { ...current, [conversationId]: next };
}
