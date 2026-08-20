"use client";

import Link from "next/link";
import { Avatar } from "./Avatar";
import { useMyAreaDropdown } from "./useMyAreaDropdown";
import type { Space } from "@/domain/Space";

type MyAreaDropdownProps = {
  isAdmin: boolean;
};

export function MyAreaDropdown({ isAdmin }: MyAreaDropdownProps) {
  const {
    rootRef,
    isOpen,
    query,
    setQuery,
    visibleSpaces,
    error,
    isLoading,
    toggle,
    close,
  } = useMyAreaDropdown();

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => void toggle()}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className={`flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium ${
          isOpen
            ? "bg-teal-50 text-teal-800"
            : "text-zinc-600 hover:bg-zinc-100"
        }`}
      >
        Minha Área
        <ChevronIcon />
      </button>
      {isOpen ? (
        <MyAreaPanel
          spaces={visibleSpaces}
          query={query}
          error={error}
          isLoading={isLoading}
          isAdmin={isAdmin}
          onQueryChange={setQuery}
          onNavigate={close}
        />
      ) : null}
    </div>
  );
}

function MyAreaPanel({
  spaces,
  query,
  error,
  isLoading,
  isAdmin,
  onQueryChange,
  onNavigate,
}: {
  spaces: Space[];
  query: string;
  error: string;
  isLoading: boolean;
  isAdmin: boolean;
  onQueryChange: (value: string) => void;
  onNavigate: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-label="Minha Área"
      aria-busy={isLoading}
      className="absolute left-0 z-30 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg max-md:fixed max-md:top-16 max-md:right-4 max-md:left-4 max-md:mt-0 max-md:w-auto"
    >
      <div className="border-b border-zinc-100 p-3">
        <input
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Procurar"
          aria-label="Procurar espaços"
          className="h-10 w-full rounded-lg border border-zinc-200 px-3 text-sm text-zinc-900 outline-none focus:border-teal-600"
        />
      </div>
      <SpaceList
        spaces={spaces}
        error={error}
        isLoading={isLoading}
        hasQuery={query.trim() !== ""}
        onNavigate={onNavigate}
      />
      {isAdmin ? (
        <div className="border-t border-zinc-100 p-3">
          <Link
            href="/espacos/novo"
            onClick={onNavigate}
            className="flex h-10 items-center justify-center rounded-lg bg-teal-700 text-sm font-semibold text-white hover:bg-teal-800"
          >
            Criar novo espaço
          </Link>
        </div>
      ) : null}
    </div>
  );
}

function SpaceList({
  spaces,
  error,
  isLoading,
  hasQuery,
  onNavigate,
}: {
  spaces: Space[];
  error: string;
  isLoading: boolean;
  hasQuery: boolean;
  onNavigate: () => void;
}) {
  if (isLoading) {
    return (
      <p className="px-4 py-8 text-center text-sm text-zinc-500">Carregando…</p>
    );
  }

  if (error) {
    return <p className="px-4 py-6 text-sm text-red-600">{error}</p>;
  }

  if (spaces.length === 0) {
    return (
      <p className="px-4 py-8 text-center text-sm text-zinc-500">
        {hasQuery ? "Nenhum espaço encontrado." : "Nenhum espaço disponível."}
      </p>
    );
  }

  return (
    <ul className="max-h-[min(22rem,60vh)] overflow-y-auto">
      {spaces.map((space) => (
        <li key={space.id}>
          <Link
            href={`/espacos/${space.id}`}
            onClick={onNavigate}
            className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-50"
          >
            <Avatar
              name={space.name}
              imageUrl={space.imageUrl}
              size="sm"
              shape="square"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-zinc-900">
                {space.name}
              </p>
              {space.description ? (
                <p className="mt-0.5 line-clamp-1 text-xs text-zinc-500">
                  {space.description}
                </p>
              ) : null}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function ChevronIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-4 w-4 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
