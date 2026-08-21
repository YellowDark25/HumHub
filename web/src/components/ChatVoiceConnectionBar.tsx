"use client";

import { useRouter } from "next/navigation";
import { leaveVoiceRoomApi } from "./voiceApi";
import { useVoiceOccupancy } from "./ChatVoiceOccupancy";

type ChatVoiceConnectionBarProps = {
  channelNames: Record<number, string>;
  workspaceHref: string;
};

export function ChatVoiceConnectionBar({
  channelNames,
  workspaceHref,
}: ChatVoiceConnectionBarProps) {
  const router = useRouter();
  const { connectedRoom } = useVoiceOccupancy();

  if (!connectedRoom) {
    return null;
  }

  const conversationId = connectedRoom.conversationId;
  const channelName = channelNames[conversationId] ?? "Canal de voz";

  async function disconnect() {
    await leaveVoiceRoomApi(conversationId).catch(() => undefined);
    router.push(workspaceHref);
  }

  return (
    <div className="border-t border-zinc-200 bg-zinc-100 px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-teal-700">Voz conectada</p>
          <p className="truncate text-[11px] text-zinc-500">{channelName}</p>
        </div>
        <button
          type="button"
          title="Desconectar"
          aria-label="Desconectar"
          onClick={() => void disconnect()}
          className="flex h-8 w-8 items-center justify-center rounded-md text-red-600 hover:bg-red-50"
        >
          <LeaveIcon />
        </button>
      </div>
    </div>
  );
}

function LeaveIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M6 9c2 4 6 8 12 9l2-3-4-2-2 1c-2-1-4-3-5-5l1-2-2-4-3 2c.3 2 1 4 1 4Z" />
    </svg>
  );
}
