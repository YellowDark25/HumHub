"use client";

import type { Space } from "@/domain/Space";
import { MAX_NOTIFICATION_SPACES } from "@/shared/notificationSettings";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "./Avatar";

type AccountSpacePickerProps = {
  spaces: Space[];
  selected: Space[];
  onChange: (spaces: Space[]) => void;
};

export function AccountSpacePicker({
  spaces,
  selected,
  onChange,
}: AccountSpacePickerProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const suggestions = spacesMatching(spaces, query, selected);

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  function addSpace(space: Space) {
    if (selected.length >= MAX_NOTIFICATION_SPACES) {
      return;
    }

    onChange([...selected, space]);
    setQuery("");
  }

  function removeSpace(spaceId: number) {
    onChange(selected.filter((space) => space.id !== spaceId));
  }

  return (
    <div ref={rootRef} className="relative">
      <div className="flex min-h-12 flex-wrap items-center gap-2 rounded-xl border border-zinc-200 bg-white px-2 py-2 focus-within:border-teal-600">
        {selected.map((space) => (
          <span
            key={space.id}
            className="flex items-center gap-1.5 rounded-lg bg-teal-50 py-1 pr-1 pl-1 text-sm text-teal-900"
          >
            <Avatar
              name={space.name}
              imageUrl={space.imageUrl}
              size="xs"
              shape="square"
            />
            <span className="max-w-40 truncate">{space.name}</span>
            <button
              type="button"
              aria-label={`Remover ${space.name}`}
              onClick={() => removeSpace(space.id)}
              className="rounded px-1 text-teal-700 hover:bg-teal-100"
            >
              ×
            </button>
          </span>
        ))}
        <input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Adicionar Espaço"
          className="min-w-40 flex-1 bg-transparent px-1 py-1 text-sm text-zinc-900 outline-none"
        />
        {selected.length > 0 ? (
          <button
            type="button"
            aria-label="Limpar espaços"
            onClick={() => onChange([])}
            className="px-1 text-zinc-400 hover:text-zinc-700"
          >
            ×
          </button>
        ) : null}
      </div>
      {isOpen && suggestions.length > 0 ? (
        <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-zinc-200 bg-white py-1 shadow-lg">
          {suggestions.map((space) => (
            <li key={space.id}>
              <button
                type="button"
                onClick={() => addSpace(space)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-800 hover:bg-zinc-50"
              >
                <Avatar
                  name={space.name}
                  imageUrl={space.imageUrl}
                  size="xs"
                  shape="square"
                />
                {space.name}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function spacesMatching(spaces: Space[], query: string, selected: Space[]) {
  const selectedIds = new Set(selected.map((space) => space.id));
  const remaining = spaces.filter((space) => !selectedIds.has(space.id));
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) {
    return remaining;
  }

  return remaining.filter((space) =>
    space.name.toLowerCase().includes(trimmed),
  );
}
