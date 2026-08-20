"use client";

import { useEffect, useRef, useState } from "react";
import { Avatar } from "./Avatar";

type PickerUser = {
  id: number;
  name: string;
  imageUrl?: string;
};

type AccountUserPickerProps = {
  label: string;
  users: PickerUser[];
  selected: PickerUser[];
  onChange: (users: PickerUser[]) => void;
};

export function AccountUserPicker({
  label,
  users,
  selected,
  onChange,
}: AccountUserPickerProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const suggestions = usersMatching(users, query, selected);

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  function addUser(user: PickerUser) {
    onChange([...selected, user]);
    setQuery("");
  }

  return (
    <div ref={rootRef} className="relative">
      <p className="mb-1 text-sm font-medium text-zinc-700">{label}</p>
      <div className="flex min-h-12 flex-wrap items-center gap-2 rounded-xl border border-zinc-200 bg-white px-2 py-2 focus-within:border-teal-600">
        {selected.map((user) => (
          <span
            key={user.id}
            className="flex items-center gap-1.5 rounded-lg bg-teal-50 py-1 pr-1 pl-1 text-sm text-teal-900"
          >
            <Avatar name={user.name} imageUrl={user.imageUrl} size="xs" />
            <span className="max-w-40 truncate">{user.name}</span>
            <button
              type="button"
              aria-label={`Remover ${user.name}`}
              onClick={() =>
                onChange(selected.filter((item) => item.id !== user.id))
              }
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
          placeholder="Adicionar usuário..."
          className="min-w-40 flex-1 bg-transparent px-1 py-1 text-sm text-zinc-900 outline-none"
        />
      </div>
      {isOpen && suggestions.length > 0 ? (
        <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-zinc-200 bg-white py-1 shadow-lg">
          {suggestions.map((user) => (
            <li key={user.id}>
              <button
                type="button"
                onClick={() => addUser(user)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-800 hover:bg-zinc-50"
              >
                <Avatar name={user.name} imageUrl={user.imageUrl} size="xs" />
                {user.name}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function usersMatching(
  users: PickerUser[],
  query: string,
  selected: PickerUser[],
) {
  const selectedIds = new Set(selected.map((user) => user.id));
  const remaining = users.filter((user) => !selectedIds.has(user.id));
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) {
    return remaining.slice(0, 8);
  }

  return remaining.filter((user) =>
    user.name.toLowerCase().includes(trimmed),
  );
}
