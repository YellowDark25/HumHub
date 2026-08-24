"use client";

import { useEffect, useRef } from "react";
import type { ChatLiveEvent } from "@/domain/ChatLive";
import type { ChatMessage } from "@/domain/ChatMessage";
import {
  CHAT_LIVE_POLL_MS,
  CHAT_LIVE_RECONNECT_MS,
  readChatLiveEvent,
} from "@/shared/chatLive";
import { readApiError } from "@/shared/readApiError";

export function useChatLive(
  conversationId: number,
  lastMessageId: number,
  onEvent: (event: ChatLiveEvent) => void,
) {
  const onEventRef = useRef(onEvent);
  const lastIdRef = useRef(lastMessageId);
  onEventRef.current = onEvent;
  lastIdRef.current = Math.max(lastIdRef.current, lastMessageId);

  useEffect(() => {
    lastIdRef.current = Math.max(lastIdRef.current, lastMessageId);

    let stopped = false;
    let source: EventSource | null = null;
    let pollTimer = 0;
    let reconnectTimer = 0;

    function emit(event: ChatLiveEvent) {
      if (event.type === "newMessage" || event.type === "editMessage") {
        lastIdRef.current = Math.max(lastIdRef.current, event.message.id);
      }
      if (!stopped) {
        onEventRef.current(event);
      }
    }

    function startPolling() {
      if (pollTimer || stopped) {
        return;
      }

      pollTimer = window.setInterval(() => {
        if (!document.hidden) {
          void loadNewMessages(conversationId, lastIdRef.current).then(
            (incoming) => {
              for (const message of incoming) {
                emit({
                  type: "newMessage",
                  conversationId,
                  message,
                });
              }
            },
          );
        }
      }, CHAT_LIVE_POLL_MS);
    }

    function connectMercure() {
      if (typeof EventSource === "undefined") {
        return;
      }

      source = new EventSource(`/api/chat/live/stream?id=${conversationId}`);
      source.onmessage = (message) => {
        try {
          const event = readChatLiveEvent(
            JSON.parse(message.data),
            conversationId,
          );
          if (event) {
            emit(event);
          }
        } catch (error) {
          console.error("Falha ao ler evento do chat.", error);
        }
      };
      source.onerror = () => {
        source?.close();
        source = null;
        if (!stopped && !reconnectTimer) {
          reconnectTimer = window.setTimeout(() => {
            reconnectTimer = 0;
            connectMercure();
          }, CHAT_LIVE_RECONNECT_MS);
        }
      };
    }

    connectMercure();
    startPolling();

    return () => {
      stopped = true;
      source?.close();
      if (pollTimer) {
        window.clearInterval(pollTimer);
      }
      if (reconnectTimer) {
        window.clearTimeout(reconnectTimer);
      }
    };
  }, [conversationId]);
}

async function loadNewMessages(
  conversationId: number,
  since: number,
): Promise<ChatMessage[]> {
  try {
    const response = await fetch(
      `/api/chat/messages?id=${conversationId}&since=${since}`,
    );
    if (!response.ok) {
      console.error(
        await readApiError(response, "Não foi possível atualizar o chat."),
      );
      return [];
    }

    return (await response.json()) as ChatMessage[];
  } catch (error) {
    console.error("Falha de rede ao atualizar o chat.", error);
    return [];
  }
}
