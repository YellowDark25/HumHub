"use client";

import { useState } from "react";
import type { ChatEventChannelOption } from "@/domain/ChatEvent";
import { eventCountLabel } from "@/shared/chatEvent";
import { ChatEventsModal } from "./ChatEventsModal";
import { useChatEvents } from "./useChatEvents";

type ChatEventsNavProps = {
  spaceId: number;
  voiceChannels: ChatEventChannelOption[];
};

/**
 * Atalho de eventos no sidebar do servidor.
 * Mostra a quantidade (ex.: "1 Evento") e abre o painel; o item tem canto arredondado.
 */
export function ChatEventsNav({ spaceId, voiceChannels }: ChatEventsNavProps) {
  const [open, setOpen] = useState(false);
  const events = useChatEvents(spaceId, true);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left text-[15px] ${
          open
            ? "bg-zinc-200 font-medium text-zinc-900"
            : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
        }`}
      >
        <CalendarIcon />
        {eventCountLabel(events.events.length)}
      </button>
      {open ? (
        <ChatEventsModal
          spaceId={spaceId}
          voiceChannels={voiceChannels}
          eventsState={events}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </div>
  );
}

/** Ícone de calendário do atalho Eventos. */
function CalendarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4 shrink-0 text-zinc-400"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M8 3v4M16 3v4M4 10h16" />
      <path d="M8 14h.01M12 14h.01M16 14h.01" />
    </svg>
  );
}
