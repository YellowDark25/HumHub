"use client";

import { useEffect, useRef, useState } from "react";
import {
  mutualServerCountLabel,
  type ChatMutualServer,
} from "@/domain/ChatMutualServer";
import { canManageFriendship, type Person } from "@/domain/Person";
import { chatWorkspaceHref } from "@/shared/chatWorkspace";
import Link from "next/link";
import { Avatar } from "./Avatar";
import { OnlineStatusBadge } from "./OnlineStatusBadge";

type ChatPeerProfilePreviewProps = {
  name: string;
  username: string;
  imageUrl: string;
  userId: number;
  person?: Person | null;
  mutualServers?: ChatMutualServer[];
  align?: "left" | "right";
};

export function ChatPeerProfilePreview({
  name,
  username,
  imageUrl,
  userId,
  person = null,
  mutualServers = [],
  align = "left",
}: ChatPeerProfilePreviewProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const mutualLabel = mutualServerCountLabel(mutualServers.length);

  useEffect(() => {
    function closeOnOutside(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  return (
    <div ref={rootRef} className="relative inline-flex">
      <button
        type="button"
        title="Mostrar perfil do usuário"
        aria-label="Mostrar perfil do usuário"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-md ${
          open
            ? "bg-zinc-200 text-zinc-900"
            : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
        }`}
      >
        <ProfileIcon />
      </button>
      {open ? (
        <div
          className={`absolute top-full z-30 mt-2 w-80 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          <div className="h-16 bg-oxford" />
          <div className="px-4 pb-4">
            <div className="-mt-8">
              <span className="relative inline-flex rounded-full ring-4 ring-white">
                <Avatar name={name} imageUrl={imageUrl} size="lg" shape="circle" />
                <OnlineStatusBadge
                  isOnline={Boolean(person?.isOnline)}
                  showWhenOffline
                  size="md"
                />
              </span>
            </div>
            <p className="mt-3 truncate text-xl font-bold text-zinc-900">{name}</p>
            {username ? (
              <p className="truncate text-sm text-zinc-500">@{username}</p>
            ) : null}
            {person?.title ? (
              <p className="mt-1 text-sm text-zinc-600">{person.title}</p>
            ) : null}
            {person && canManageFriendship(person) ? (
              <p className="mt-2 text-xs font-medium text-teal-700">Amigos</p>
            ) : null}
            {person?.tags.length ? (
              <div className="mt-2 flex flex-wrap gap-1">
                {person.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-zinc-600 uppercase"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
            {mutualLabel ? (
              <p className="mt-3 flex items-center gap-2 text-sm text-zinc-500">
                <span className="flex items-center -space-x-1.5">
                  {mutualServers.slice(0, 3).map((server) => (
                    <Avatar
                      key={server.id}
                      name={server.name}
                      imageUrl={server.imageUrl}
                      size="xs"
                      shape="circle"
                    />
                  ))}
                </span>
                {mutualServers.length === 1 ? (
                  <Link
                    href={chatWorkspaceHref(String(mutualServers[0].id))}
                    className="hover:underline"
                  >
                    {mutualLabel}
                  </Link>
                ) : (
                  <span>{mutualLabel}</span>
                )}
              </p>
            ) : null}
            <Link
              href={`/pessoas/${userId}`}
              className="mt-4 flex h-9 cursor-pointer items-center justify-center rounded-lg border border-zinc-200 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
            >
              Ver perfil completo
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ProfileIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5.5 18.5c.8-3 3.3-4.7 6.5-4.7s5.7 1.7 6.5 4.7" />
    </svg>
  );
}
