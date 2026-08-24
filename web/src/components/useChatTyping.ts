"use client";

import { useEffect, useRef } from "react";
import {
  CHAT_TYPING_IDLE_MS,
  CHAT_TYPING_PULSE_MS,
} from "@/shared/chatTyping";
import { readApiError } from "@/shared/readApiError";

export function useChatTyping(conversationId: number) {
  const lastPulseAt = useRef(0);
  const wasTyping = useRef(false);
  const idleTimer = useRef(0);

  useEffect(() => {
    return () => {
      window.clearTimeout(idleTimer.current);
      if (wasTyping.current) {
        void postTyping(conversationId, false);
      }
    };
  }, [conversationId]);

  function notify(isTyping: boolean) {
    window.clearTimeout(idleTimer.current);
    if (!isTyping) {
      lastPulseAt.current = 0;
      if (wasTyping.current) {
        wasTyping.current = false;
        void postTyping(conversationId, false);
      }
      return;
    }

    idleTimer.current = window.setTimeout(() => {
      notify(false);
    }, CHAT_TYPING_IDLE_MS);

    const now = Date.now();
    if (wasTyping.current && now - lastPulseAt.current < CHAT_TYPING_PULSE_MS) {
      return;
    }

    lastPulseAt.current = now;
    wasTyping.current = true;
    void postTyping(conversationId, true);
  }

  return { notify };
}

async function postTyping(conversationId: number, isTyping: boolean) {
  try {
    const response = await fetch("/api/chat/typing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId, isTyping }),
      keepalive: true,
    });
    if (!response.ok) {
      console.error(
        await readApiError(response, "Não foi possível avisar a digitação."),
      );
    }
  } catch (error) {
    console.error("Falha de rede ao avisar a digitação.", error);
  }
}
