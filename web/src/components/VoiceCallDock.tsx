"use client";

import { chatConversationHref } from "@/shared/chatWorkspace";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Avatar } from "./Avatar";
import { useVoiceCall } from "./useVoiceCall";

export function VoiceCallDock() {
  const pathname = usePathname();
  const call = useVoiceCall();

  if (!call.channel) {
    return null;
  }

  if (pathname === `/chat/${call.channel.conversationId}`) {
    return null;
  }

  const href = chatConversationHref(
    call.channel.conversationId,
    call.channel.workspaceId,
  );
  const inChat = pathname.startsWith("/chat");
  const self = call.self;

  return (
    <aside
      className={`fixed bottom-20 left-4 z-40 w-44 rounded-2xl border border-zinc-200 bg-white p-3 shadow-lg md:bottom-4 ${
        inChat ? "lg:hidden" : ""
      }`}
    >
      <Link href={href} className="flex flex-col items-center text-center">
        <div className="flex aspect-square w-full items-center justify-center rounded-xl bg-zinc-100">
          <Avatar
            name={self?.name ?? "Você"}
            imageUrl={self?.imageUrl}
            size="lg"
            shape="circle"
          />
        </div>
        <p className="mt-2 text-sm font-semibold text-green-600">Voz conectada</p>
        <p className="w-full truncate text-xs text-zinc-500">{call.channel.channelName}</p>
      </Link>
      <div className="mt-3 flex items-center justify-center gap-1.5">
        <DockButton
          label={call.media.isMicMuted ? "Ativar microfone" : "Silenciar microfone"}
          isOff={call.media.isMicMuted}
          onClick={call.toggleMic}
        >
          <MicIcon muted={call.media.isMicMuted} />
        </DockButton>
        <DockButton
          label={call.media.isDeafened ? "Ativar áudio" : "Desativar áudio"}
          isOff={call.media.isDeafened}
          onClick={call.toggleDeafen}
        >
          <HeadphoneIcon deafened={call.media.isDeafened} />
        </DockButton>
        <DockButton
          label="Sair da chamada"
          isOff
          onClick={() => void call.leave()}
        >
          <LeaveIcon />
        </DockButton>
      </div>
    </aside>
  );
}

function DockButton({
  label,
  isOff,
  onClick,
  children,
}: {
  label: string;
  isOff: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={`flex h-9 w-9 items-center justify-center rounded-lg ${
        isOff ? "bg-red-50 text-red-600" : "text-zinc-600 hover:bg-zinc-100"
      }`}
    >
      {children}
    </button>
  );
}

function MicIcon({ muted }: { muted: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
      {muted ? <path d="m4 4 16 16" /> : null}
    </svg>
  );
}

function HeadphoneIcon({ deafened }: { deafened: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M4 13v3a2 2 0 0 0 2 2h1v-7H6a2 2 0 0 0-2 2Z" />
      <path d="M20 13v3a2 2 0 0 1-2 2h-1v-7h1a2 2 0 0 1 2 2Z" />
      <path d="M4 13a8 8 0 0 1 16 0" />
      {deafened ? <path d="m4 4 16 16" /> : null}
    </svg>
  );
}

function LeaveIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M6 9c2 4 6 8 12 9l2-3-4-2-2 1c-2-1-4-3-5-5l1-2-2-4-3 2c.3 2 1 4 1 4Z" />
    </svg>
  );
}
