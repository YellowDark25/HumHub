"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Space } from "@/domain/Space";
import { readApiError } from "@/shared/readApiError";

export function useMyAreaDropdown() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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

  const visibleSpaces = useMemo(
    () => spacesMatching(spaces, query),
    [spaces, query],
  );

  async function loadSpaces() {
    setError("");
    setIsLoading(true);
    try {
      const response = await fetch("/api/spaces");
      if (!response.ok) {
        setError(await readApiError(response, "Não foi possível carregar os espaços."));
        return;
      }

      setSpaces((await response.json()) as Space[]);
    } catch {
      setError("Falha de rede ao carregar os espaços.");
    } finally {
      setIsLoading(false);
    }
  }

  async function toggle() {
    const nextOpen = !isOpen;
    setIsOpen(nextOpen);
    if (!nextOpen) {
      setQuery("");
      return;
    }

    await loadSpaces();
  }

  return {
    rootRef,
    isOpen,
    query,
    setQuery,
    visibleSpaces,
    error,
    isLoading,
    toggle,
    close: () => setIsOpen(false),
  };
}

function spacesMatching(spaces: Space[], query: string): Space[] {
  const term = query.trim().toLowerCase();
  if (!term) {
    return spaces;
  }

  return spaces.filter(
    (space) =>
      space.name.toLowerCase().includes(term) ||
      space.description.toLowerCase().includes(term),
  );
}
