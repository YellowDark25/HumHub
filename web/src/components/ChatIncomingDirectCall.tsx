"use client";

import { HOME_WORKSPACE_ID } from "@/domain/ChatWorkspace";
import { pickIncomingDirectCall } from "@/domain/VoiceRoom";
import { chatConversationHref } from "@/shared/chatWorkspace";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Avatar } from "./Avatar";
import { useVoiceOccupancy } from "./ChatVoiceOccupancy";
import { useVoiceCall } from "./useVoiceCall";
import { useVoiceRingtone } from "./useVoiceRingtone";

export function ChatIncomingDirectCall() {
  const pathname = usePathname();
  const router = useRouter();
  const call = useVoiceCall();
  const { occupancyRooms } = useVoiceOccupancy();
  const [dismissedId, setDismissedId] = useState(0);
  const incoming = pickIncomingDirectCall(
    occupancyRooms,
    call.self?.userId ?? 0,
    call.channel?.conversationId ?? null,
  );
  const isViewingChat = incoming
    ? pathname === `/chat/${incoming.conversationId}`
    : false;
  const visible =
    Boolean(incoming) &&
    incoming?.conversationId !== dismissedId &&
    !isViewingChat &&
    !call.channel;

  useVoiceRingtone(Boolean(visible));

  if (!incoming || !visible) {
    return null;
  }

  const caller =
    incoming.participants.find((person) => person.userId !== call.self?.userId) ??
    incoming.participants[0];

  return (
    <aside className="fixed top-20 left-1/2 z-50 w-80 -translate-x-1/2 rounded-2xl border border-zinc-200 bg-white p-4 shadow-xl">
      <div className="flex flex-col items-center text-center">
        <Avatar
          name={caller?.name ?? incoming.name}
          imageUrl={caller?.imageUrl}
          size="lg"
          shape="circle"
        />
        <p className="mt-2 text-sm font-semibold text-zinc-900">
          {incoming.name}
        </p>
        <p className="text-sm text-green-600">Chamada recebida</p>
        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setDismissedId(incoming.conversationId)}
            className="rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500"
          >
            Recusar
          </button>
          <button
            type="button"
            onClick={() => {
              void call.join({
                conversationId: incoming.conversationId,
                channelName: incoming.name,
                workspaceId: HOME_WORKSPACE_ID,
                kind: "dm",
              });
              router.push(
                chatConversationHref(incoming.conversationId, HOME_WORKSPACE_ID),
              );
            }}
            className="rounded-full bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-500"
          >
            Atender
          </button>
        </div>
      </div>
    </aside>
  );
}
