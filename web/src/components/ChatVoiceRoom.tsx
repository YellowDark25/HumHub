"use client";

import { useState } from "react";
import type { User } from "@/domain/User";
import { chatWorkspaceHref } from "@/shared/chatWorkspace";
import { leaveVoiceRoomApi } from "./voiceApi";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChatInviteFriendsModal } from "./ChatInviteFriendsModal";
import { ChatVoiceControls } from "./ChatVoiceControls";
import { ChatVoiceTile } from "./ChatVoiceTile";
import { useVoiceCall } from "./useVoiceCall";

type ChatVoiceRoomProps = {
  conversationId: number;
  channelName: string;
  workspaceId: string;
  workspaceName: string;
  currentUser: User;
};

export function ChatVoiceRoom({
  conversationId,
  channelName,
  workspaceId,
  workspaceName,
  currentUser,
}: ChatVoiceRoomProps) {
  const router = useRouter();
  const call = useVoiceCall(conversationId, currentUser);
  const [inviteOpen, setInviteOpen] = useState(false);
  const homeHref = chatWorkspaceHref(workspaceId);
  const self = call.self ?? {
    userId: currentUser.id,
    name: currentUser.name,
    imageUrl: currentUser.imageUrl,
    joinedAt: 0,
    ...call.media,
  };

  async function leaveCall() {
    await leaveVoiceRoomApi(conversationId).catch(() => undefined);
    router.push(homeHref);
  }

  return (
    <section className="relative flex min-h-0 flex-1 flex-col bg-white text-zinc-900">
      <header className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
        <div>
          <Link
            href={homeHref}
            className="text-xs font-medium text-teal-700 lg:hidden"
          >
            Voltar
          </Link>
          <h1 className="flex items-center gap-2 text-base font-semibold text-zinc-900">
            <SpeakerIcon />
            {channelName}
          </h1>
        </div>
        <p className="text-xs text-zinc-500">
          {call.room
            ? `${call.room.participants.length} em chamada`
            : "Entrando..."}
        </p>
      </header>

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 overflow-y-auto bg-zinc-50 p-4">
        {call.error ? (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
            {call.error}
          </p>
        ) : null}

        <div
          className={`grid w-full gap-3 ${
            call.others.length === 0
              ? "max-w-3xl grid-cols-1"
              : "grid-cols-1 md:grid-cols-2"
          }`}
        >
          <ChatVoiceTile
            participant={self}
            stream={call.stream ?? undefined}
            isSelf
            isDeafened={call.media.isDeafened}
          />
          {call.others.map((participant) => (
            <ChatVoiceTile
              key={participant.userId}
              participant={participant}
              stream={call.remoteStreams[participant.userId]}
              isDeafened={call.media.isDeafened}
            />
          ))}
        </div>

        {call.others.length === 0 ? (
          <div className="flex flex-col items-center gap-3 text-center">
            <p className="text-sm text-zinc-500">
              Você está na sala. Convide alguém para conversar.
            </p>
            <button
              type="button"
              onClick={() => setInviteOpen(true)}
              className="rounded-xl bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
            >
              Convidar para voz
            </button>
          </div>
        ) : null}
      </div>

      <footer className="flex justify-center border-t border-zinc-200 bg-white px-4 py-5">
        <ChatVoiceControls
          media={call.media}
          onToggleMic={call.toggleMic}
          onToggleCamera={() => void call.toggleCamera()}
          onToggleScreen={() => void call.toggleScreenShare()}
          onLeave={() => void leaveCall()}
        />
      </footer>

      {inviteOpen ? (
        <ChatInviteFriendsModal
          conversationId={conversationId}
          workspaceId={workspaceId}
          workspaceName={workspaceName}
          channelName={channelName}
          channelType="voice"
          onClose={() => setInviteOpen(false)}
          onEditInvites={() => setInviteOpen(false)}
        />
      ) : null}
    </section>
  );
}

function SpeakerIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 text-zinc-400" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M4 10v4h3l5 4V6L7 10H4Z" />
      <path d="M16 9.5a4 4 0 0 1 0 5" />
    </svg>
  );
}
