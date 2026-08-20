"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { Notification } from "@/domain/Notification";
import { readApiError } from "@/shared/readApiError";

const DROPDOWN_LIMIT = 6;

export function useNotificationDropdown(unseenCount: number) {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [badgeCount, setBadgeCount] = useState(unseenCount);
  const [items, setItems] = useState<Notification[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMarking, setIsMarking] = useState(false);

  useEffect(() => {
    setBadgeCount(unseenCount);
  }, [unseenCount]);

  useEffect(() => {
    if (!isOpen) {
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

  async function loadItems() {
    setError("");
    setIsLoading(true);
    try {
      const response = await fetch(`/api/notifications?limit=${DROPDOWN_LIMIT}`);
      if (!response.ok) {
        setError(
          await readApiError(response, "Não foi possível carregar as notificações."),
        );
        return;
      }

      setItems((await response.json()) as Notification[]);
    } catch {
      setError("Falha de rede ao carregar as notificações.");
    } finally {
      setIsLoading(false);
    }
  }

  async function toggle() {
    const nextOpen = !isOpen;
    setIsOpen(nextOpen);
    if (nextOpen) {
      await loadItems();
    }
  }

  async function markAllAsSeen() {
    if (isMarking || badgeCount === 0) {
      return;
    }

    setError("");
    setIsMarking(true);
    try {
      const response = await fetch("/api/notifications/seen", { method: "PATCH" });
      if (!response.ok) {
        setError(
          await readApiError(response, "Não foi possível marcar como lidas."),
        );
        return;
      }

      setBadgeCount(0);
      setItems((current) =>
        current.map((notification) => ({ ...notification, isUnseen: false })),
      );
      router.refresh();
    } catch {
      setError("Falha de rede ao marcar as notificações como lidas.");
    } finally {
      setIsMarking(false);
    }
  }

  return {
    rootRef,
    isOpen,
    badgeCount,
    items,
    error,
    isLoading,
    isMarking,
    toggle,
    markAllAsSeen,
    close: () => setIsOpen(false),
  };
}
