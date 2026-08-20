"use client";

import { useState, type KeyboardEvent } from "react";

type AccountTagPickerProps = {
  tags: string[];
  onChange: (tags: string[]) => void;
};

export function AccountTagPicker({ tags, onChange }: AccountTagPickerProps) {
  const [draft, setDraft] = useState("");

  function addTag(raw: string) {
    const tag = raw.trim();
    if (!tag || tags.includes(tag)) {
      setDraft("");
      return;
    }

    onChange([...tags, tag]);
    setDraft("");
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addTag(draft);
      return;
    }

    if (event.key === "Backspace" && draft === "" && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  }

  return (
    <div>
      <p className="mb-1 text-sm font-medium text-zinc-700">Tags de perfil</p>
      <div className="flex min-h-12 flex-wrap items-center gap-2 rounded-xl border border-zinc-200 bg-white px-2 py-2 focus-within:border-teal-600">
        {tags.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 rounded-lg bg-teal-500 py-1 pr-1 pl-2.5 text-sm text-white"
          >
            {tag}
            <button
              type="button"
              aria-label={`Remover ${tag}`}
              onClick={() => onChange(tags.filter((item) => item !== tag))}
              className="rounded px-1 hover:bg-teal-600"
            >
              ×
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => addTag(draft)}
          placeholder="Adicionar tag..."
          className="min-w-32 flex-1 bg-transparent px-1 py-1 text-sm text-zinc-900 outline-none"
        />
        {tags.length > 0 ? (
          <button
            type="button"
            aria-label="Limpar tags"
            onClick={() => onChange([])}
            className="px-1 text-zinc-400 hover:text-zinc-700"
          >
            ×
          </button>
        ) : null}
      </div>
    </div>
  );
}
