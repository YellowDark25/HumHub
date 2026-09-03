"use client";

import { useChatSession } from "./ChatSession";
import { ChatTabLink } from "./ChatTabLink";
import { useVoiceCall } from "./useVoiceCall";

/**
 * Barra de voz na base da sidebar enquanto houver canal conectado.
 * O nome volta à conversa nesta aba; desconectar no canal de voz volta ao servidor.
 */
export function ChatVoiceConnectionBar() {
  const { conversationId: activeId, openConversation, openWorkspace } =
    useChatSession();
  const { channel, leave } = useVoiceCall();

  if (!channel) {
    return null;
  }

  const conversationId = channel.conversationId;
  const isDirect = channel.kind === "dm";

  async function disconnect() {
    const wasOnVoiceChannel = !isDirect && activeId === conversationId;
    await leave();
    if (wasOnVoiceChannel) {
      openWorkspace(channel.workspaceId);
    }
  }

  return (
    <div className="border-t border-zinc-200 bg-zinc-100 px-3.5 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <ChatTabLink
          className="min-w-0 text-left"
          onOpen={() => openConversation(conversationId, channel.workspaceId)}
        >
          <p className="text-sm font-semibold text-green-600">
            {isDirect ? "Em chamada" : "Voz conectada"}
          </p>
          <p className="truncate text-xs text-zinc-500">{channel.channelName}</p>
        </ChatTabLink>
        <button
          type="button"
          title="Desconectar"
          aria-label="Desconectar"
          onClick={() => void disconnect()}
          className="flex h-9 w-9 items-center justify-center rounded-md text-red-600 hover:bg-red-50"
        >
          <LeaveIcon />
        </button>
      </div>
    </div>
  );
}

function LeaveIcon() {
  return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M6 9c2 4 6 8 12 9l2-3-4-2-2 1c-2-1-4-3-5-5l1-2-2-4-3 2c.3 2 1 4 1 4Z" />
    </svg>
  );
}
