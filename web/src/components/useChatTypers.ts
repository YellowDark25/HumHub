"use client";

import { useEffect, useState } from "react";
import type { ChatLiveEvent } from "@/domain/ChatLive";
import type { ChatTyper } from "@/domain/ChatTyping";
import {
  applyTypingPresence,
  expireTypers,
  typingLabel,
} from "@/shared/chatTyping";

const TYPING_SWEEP_MS = 1_000;

export function useChatTypers(currentUserId: number) {
  const [typers, setTypers] = useState<ChatTyper[]>([]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTypers((current) => expireTypers(current));
    }, TYPING_SWEEP_MS);

    return () => window.clearInterval(timer);
  }, []);

  function onLiveEvent(event: ChatLiveEvent) {
    setTypers((current) => applyTypingPresence(current, event, currentUserId));
  }

  return {
    label: typingLabel(typers),
    onLiveEvent,
  };
}
