"use client";

import { useEffect, useRef, useState } from "react";
import type {
  ChatMuteDuration,
  ChatNotificationLevel,
  ChatNotificationPreference,
} from "@/domain/ChatNotificationPreference";
import { readApiError } from "@/shared/readApiError";

export function useChatServerNotifications(
  initial: ChatNotificationPreference,
) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [preference, setPreference] = useState(initial);
  const [isOpen, setIsOpen] = useState(false);
  const [isMuteOpen, setIsMuteOpen] = useState(false);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setPreference(initial);
  }, [initial]);

  useEffect(() => {
    if (!isOpen) {
      setIsMuteOpen(false);
      return;
    }

    function closeOnOutsideClick(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  async function save(patch: {
    level?: ChatNotificationLevel;
    muteDuration?: ChatMuteDuration | null;
  }) {
    setError("");
    setIsSaving(true);
    try {
      const response = await fetch("/api/chat/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spaceId: preference.spaceId, ...patch }),
      });
      if (!response.ok) {
        setError(
          await readApiError(response, "Não foi possível salvar as preferências."),
        );
        return;
      }

      setPreference((await response.json()) as ChatNotificationPreference);
      if (patch.muteDuration !== undefined) {
        setIsMuteOpen(false);
      }
    } catch {
      setError("Falha de rede ao salvar as preferências.");
    } finally {
      setIsSaving(false);
    }
  }

  return {
    rootRef,
    preference,
    isOpen,
    isMuteOpen,
    error,
    isSaving,
    toggle: () => setIsOpen((open) => !open),
    openMute: () => setIsMuteOpen(true),
    closeMute: () => setIsMuteOpen(false),
    saveLevel: (level: ChatNotificationLevel) => void save({ level }),
    muteFor: (muteDuration: ChatMuteDuration) => void save({ muteDuration }),
    unmute: () => void save({ muteDuration: null }),
  };
}
