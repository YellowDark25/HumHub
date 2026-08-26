"use client";

import { useEffect, useState } from "react";
import type { ChatNotificationPreference } from "@/domain/ChatNotificationPreference";
import type { User } from "@/domain/User";
import { chatWorkspaceHref } from "@/shared/chatWorkspace";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChatInviteFriendsModal } from "./ChatInviteFriendsModal";
import { ChatMemberPanel } from "./ChatMemberPanel";
import { ChatMembersButton } from "./ChatMembersButton";
import { ChatServerHeaderActions } from "./ChatServerHeaderActions";
import { ChatVoiceStage } from "./ChatVoiceStage";
import { useVoiceCall } from "./useVoiceCall";

type ChatVoiceRoomProps = {
  conversationId: number;
  channelName: string;
  workspaceId: string;
  workspaceName: string;
  currentUser: User;
  notificationPreference?: ChatNotificationPreference | null;
};

/**
 * Sala de voz do canal, com o mesmo ícone de membros do chat de texto.
 * Entra na chamada ao montar e abre o roster à direita quando o ícone está ativo.
 */
export function ChatVoiceRoom({
  conversationId,
  channelName,
  workspaceId,
  workspaceName,
  currentUser,
  notificationPreference = null,
}: ChatVoiceRoomProps) {
  const router = useRouter();
  const call = useVoiceCall();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  const homeHref = chatWorkspaceHref(workspaceId);

  useEffect(() => {
    void call.join({ conversationId, channelName, workspaceId, kind: "channel" });
  }, [call.join, channelName, conversationId, workspaceId]);

  async function leaveCall() {
    await call.leave();
    router.push(homeHref);
  }

  return (
    <div className="relative flex min-h-0 min-w-0 flex-1 overflow-hidden">
    <ChatVoiceStage
      conversationId={conversationId}
      currentUser={currentUser}
      title={
        <>
          <Link
            href={homeHref}
            className="text-sm font-medium text-teal-700 lg:hidden"
          >
            Voltar
          </Link>
          <SpeakerIcon />
          {channelName}
        </>
      }
      headerTrailing={
        <div className="flex items-center gap-1">
          <ChatServerHeaderActions
            conversationId={conversationId}
            conversationName={channelName}
            workspaceId={workspaceId}
            notificationPreference={notificationPreference}
          />
          <ChatMembersButton
            open={membersOpen}
            onToggle={() => setMembersOpen((current) => !current)}
          />
        </div>
      }
      onLeave={() => void leaveCall()}
      onInvite={() => setInviteOpen(true)}
      inviteModal={
        inviteOpen ? (
          <ChatInviteFriendsModal
            conversationId={conversationId}
            workspaceId={workspaceId}
            workspaceName={workspaceName}
            channelName={channelName}
            channelType="voice"
            onClose={() => setInviteOpen(false)}
            onEditInvites={() => setInviteOpen(false)}
          />
        ) : null
      }
    />
      {membersOpen ? (
        <>
          <button
            type="button"
            aria-label="Fechar membros"
            onClick={() => setMembersOpen(false)}
            className="absolute inset-0 z-10 bg-zinc-900/20 lg:hidden"
          />
          <ChatMemberPanel
            conversationId={conversationId}
            currentUserId={currentUser.id}
            onClose={() => setMembersOpen(false)}
          />
        </>
      ) : null}
    </div>
  );
}

function SpeakerIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-zinc-400" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M4 10v4h3l5 4V6L7 10H4Z" />
      <path d="M16 9.5a4 4 0 0 1 0 5" />
    </svg>
  );
}
