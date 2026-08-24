"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { Notification } from "@/domain/Notification";
import { mergeLiveNotification } from "@/shared/notificationLive";
import { readApiError } from "@/shared/readApiError";
import { useNotificationLive } from "./useNotificationLive";

const DROPDOWN_LIMIT = 6;

export function useNotificationDropdown(unseenCount: number) {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const isOpenRef = useRef(false);
  const badgeCountRef = useRef(unseenCount);
  const [isOpen, setIsOpen] = useState(false);
  const [badgeCount, setBadgeCount] = useState(unseenCount);
  const [items, setItems] = useState<Notification[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMarking, setIsMarking] = useState(false);

  isOpenRef.current = isOpen;
  badgeCountRef.current = badgeCount;

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

  useNotificationLive((event) => {
    const incoming = event.notification;
    if (!incoming && event.unseenCount === badgeCountRef.current) {
      return;
    }

    setBadgeCount(event.unseenCount);
    if (incoming) {
      setItems((current) =>
        mergeLiveNotification(current, incoming, DROPDOWN_LIMIT),
      );
      return;
    }

    if (isOpenRef.current) {
      void refreshOpenItems(setItems);
    }
  });

  async function loadItems() {
    setError("");
    setIsLoading(true);
    try {
      const nextItems = await fetchDropdownItems();
      setItems(nextItems);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Falha de rede ao carregar as notificações.",
      );
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

async function refreshOpenItems(
  setItems: (items: Notification[]) => void,
) {
  try {
    setItems(await fetchDropdownItems());
  } catch (error) {
    console.error("Falha ao atualizar as notificações abertas.", error);
  }
}

async function fetchDropdownItems(): Promise<Notification[]> {
  const response = await fetch(`/api/notifications?limit=${DROPDOWN_LIMIT}`);
  if (!response.ok) {
    throw new Error(
      await readApiError(response, "Não foi possível carregar as notificações."),
    );
  }

  return (await response.json()) as Notification[];
}
