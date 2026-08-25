"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type {
  SpaceMembershipSettings,
  SpaceMembershipSettingsPatch,
} from "@/domain/SpaceMembershipSettings";
import { readApiError } from "@/shared/readApiError";

export const SPACE_SETTINGS_MENU_WIDTH = 320;

const MENU_GAP = 8;
const VIEWPORT_PAD = 8;
const FALLBACK_MENU_HEIGHT = 220;

export function useSpaceSettings(
  spaceId: number,
  initial: SpaceMembershipSettings,
) {
  const router = useRouter();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [settings, setSettings] = useState(initial);
  const [isOpen, setIsOpen] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    setSettings(initial);
  }, [
    spaceId,
    initial.canLeave,
    initial.receivesNotifications,
    initial.showsOnDashboard,
  ]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function placeMenu() {
      if (!buttonRef.current) {
        return;
      }

      const height = menuRef.current?.offsetHeight || FALLBACK_MENU_HEIGHT;
      setPosition(readMenuPosition(buttonRef.current, height));
    }

    function closeOnOutsideClick(event: MouseEvent) {
      const target = event.target as Node;
      if (
        buttonRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }

      setIsOpen(false);
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !confirmLeave) {
        setIsOpen(false);
      }
    }

    placeMenu();
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    window.addEventListener("resize", placeMenu);
    const scrollTimer = window.setTimeout(() => {
      window.addEventListener("scroll", placeMenu, true);
    }, 0);
    return () => {
      window.clearTimeout(scrollTimer);
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("resize", placeMenu);
      window.removeEventListener("scroll", placeMenu, true);
    };
  }, [confirmLeave, isOpen]);

  function toggle() {
    setError("");
    if (isOpen) {
      setIsOpen(false);
      return;
    }

    if (buttonRef.current) {
      setPosition(readMenuPosition(buttonRef.current, FALLBACK_MENU_HEIGHT));
    }

    setIsOpen(true);
  }

  function close() {
    setIsOpen(false);
  }

  function askLeave() {
    setError("");
    setConfirmLeave(true);
    setIsOpen(false);
  }

  function cancelLeave() {
    if (!isLeaving) {
      setConfirmLeave(false);
    }
  }

  async function toggleNotifications() {
    await savePatch({
      receivesNotifications: !settings.receivesNotifications,
    });
  }

  async function toggleDashboard() {
    await savePatch({
      showsOnDashboard: !settings.showsOnDashboard,
    });
  }

  async function leave() {
    setError("");
    setIsLeaving(true);
    try {
      const response = await fetch(`/api/spaces/${spaceId}/leave`, {
        method: "POST",
      });
      if (!response.ok) {
        setError(await readApiError(response, "Não foi possível sair do espaço."));
        setConfirmLeave(false);
        setIsOpen(true);
        return;
      }

      setConfirmLeave(false);
      router.push("/espacos");
      router.refresh();
    } catch {
      setError("Falha de rede ao sair do espaço.");
      setConfirmLeave(false);
      setIsOpen(true);
    } finally {
      setIsLeaving(false);
    }
  }

  async function savePatch(patch: SpaceMembershipSettingsPatch) {
    setError("");
    setIsSaving(true);
    const previous = settings;
    setSettings({ ...settings, ...patch });
    try {
      const response = await fetch(`/api/spaces/${spaceId}/membership`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!response.ok) {
        setSettings(previous);
        setError(
          await readApiError(
            response,
            "Não foi possível salvar as configurações do espaço.",
          ),
        );
        return;
      }

      const updated = (await response.json()) as SpaceMembershipSettings;
      setSettings(updated);
    } catch {
      setSettings(previous);
      setError("Falha de rede ao salvar as configurações do espaço.");
    } finally {
      setIsSaving(false);
    }
  }

  return {
    buttonRef,
    menuRef,
    position,
    settings,
    isOpen,
    isSaving,
    isLeaving,
    confirmLeave,
    error,
    toggle,
    close,
    askLeave,
    cancelLeave,
    leave,
    toggleNotifications,
    toggleDashboard,
  };
}

function readMenuPosition(button: HTMLElement, menuHeight: number) {
  const rect = button.getBoundingClientRect();
  const spaceBelow = window.innerHeight - rect.bottom - VIEWPORT_PAD;
  const openUpward = spaceBelow < menuHeight + MENU_GAP;
  const top = openUpward
    ? rect.top - menuHeight - MENU_GAP
    : rect.bottom + MENU_GAP;
  const maxLeft = window.innerWidth - SPACE_SETTINGS_MENU_WIDTH - VIEWPORT_PAD;

  return {
    top: Math.max(VIEWPORT_PAD, top),
    left: Math.min(Math.max(VIEWPORT_PAD, rect.right - SPACE_SETTINGS_MENU_WIDTH), maxLeft),
  };
}
