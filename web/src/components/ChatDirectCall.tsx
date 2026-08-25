"use client";

import {
  DIRECT_CALL_RING_MS,
  isDirectCallWaiting,
  isVideoCallActive,
} from "@/domain/VoiceRoom";
import { useEffect, useState, type ReactNode } from "react";
import { Avatar } from "./Avatar";
import { ChatVoiceStage } from "./ChatVoiceStage";
import { recordDirectCallStart } from "./directCallLog";
import { forceStopVoiceRingtone } from "./playVoiceChime";
import { useVoiceRingtone } from "./useVoiceRingtone";
import { useVoiceCallDuration, useVoiceOccupancy } from "./ChatVoiceOccupancy";
import { useVoiceCall } from "./useVoiceCall";

type ChatDirectCallProps = {
  conversationId: number;
  conversationName: string;
  workspaceId: string;
  peerImageUrl: string;
};

export function ChatDirectCallButton({
  conversationId,
  conversationName,
  workspaceId,
}: Omit<ChatDirectCallProps, "peerImageUrl">) {
  const session = useDirectCallSession(conversationId, conversationName, workspaceId);

  return (
    <button
      type="button"
      title={session.buttonLabel}
      aria-label={session.buttonLabel}
      disabled={session.isJoining}
      onClick={() => void session.toggle()}
      className={`flex h-9 w-9 items-center justify-center rounded-md ${
        session.isThisCall
          ? "text-red-600 hover:bg-red-50"
          : session.isIncoming
            ? "animate-pulse text-green-600 hover:bg-green-50"
            : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
      }`}
    >
      <PhoneIcon />
    </button>
  );
}

export function ChatDirectCallStage({
  conversationId,
  conversationName,
}: Pick<ChatDirectCallProps, "conversationId" | "conversationName">) {
  const call = useVoiceCall();
  const isThisCall = call.channel?.conversationId === conversationId;
  const hasVideo = isThisCall && isVideoCallActive([call.media, ...call.others]);

  if (!isThisCall || !hasVideo || !call.self) {
    return null;
  }

  return (
    <div className="relative h-[min(46vh,26rem)] shrink-0 overflow-hidden border-b border-zinc-200">
      <ChatVoiceStage
        conversationId={conversationId}
        currentUser={call.self}
        title={
          <span className="flex min-w-0 items-center gap-2">
            <CameraIcon off={false} />
            {conversationName}
          </span>
        }
        onLeave={() => void call.leave()}
      />
    </div>
  );
}

export function ChatDirectCallBar({
  conversationId,
  conversationName,
  workspaceId,
  peerImageUrl,
}: ChatDirectCallProps) {
  const session = useDirectCallSession(conversationId, conversationName, workspaceId);
  const duration = useVoiceCallDuration(session.isThisCall ? conversationId : null);

  useEffect(() => {
    if (!session.isCalling) {
      return;
    }

    const timer = window.setTimeout(() => {
      void session.hangup();
    }, DIRECT_CALL_RING_MS);
    return () => window.clearTimeout(timer);
  }, [session.isCalling, session.hangup]);

  useVoiceRingtone(
    (session.isCalling || session.isIncoming) && !session.isConnected,
  );

  if (!session.isVisible || session.hasVideo) {
    return null;
  }

  return (
    <div className="flex shrink-0 items-center justify-between gap-3 border-b border-zinc-200 bg-zinc-50 px-4 py-3">
      <div className="flex w-24 items-center justify-start gap-1">
        {session.isIncoming ? null : (
          <>
            <CallIconButton
              label={session.media.isMicMuted ? "Ativar microfone" : "Silenciar microfone"}
              isOff={session.media.isMicMuted}
              onClick={session.toggleMic}
            >
              <MicIcon muted={session.media.isMicMuted} />
            </CallIconButton>
            <CallIconButton
              label={session.media.isCameraOn ? "Desligar câmera" : "Ligar câmera"}
              isOff={!session.media.isCameraOn}
              onClick={() => void session.toggleCamera()}
            >
              <CameraIcon off={!session.media.isCameraOn} />
            </CallIconButton>
          </>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
        <div className="flex items-center -space-x-2">
          <Avatar
            name={conversationName}
            imageUrl={peerImageUrl}
            size="lg"
            shape="circle"
          />
          {session.self ? (
            <Avatar
              name={session.self.name}
              imageUrl={session.self.imageUrl}
              size="lg"
              shape="circle"
            />
          ) : null}
        </div>
        <p className="text-sm font-medium text-green-600">
          {session.statusLabel(duration)}
        </p>
        {session.error ? (
          <p className="text-xs text-red-600">{session.error}</p>
        ) : null}
      </div>

      <div className="flex w-24 items-center justify-end gap-1">
        {session.isIncoming ? (
          <>
            <CallIconButton
              label="Recusar"
              isOff
              onClick={() => session.dismissIncoming()}
            >
              <PhoneIcon />
            </CallIconButton>
            <CallIconButton
              label="Atender"
              isActive
              onClick={() => void session.accept()}
            >
              <PhoneIcon />
            </CallIconButton>
          </>
        ) : (
          <CallIconButton
            label="Encerrar chamada"
            isOff
            onClick={() => void session.hangup()}
          >
            <LeaveIcon />
          </CallIconButton>
        )}
      </div>
    </div>
  );
}

function useDirectCallSession(
  conversationId: number,
  conversationName: string,
  workspaceId: string,
) {
  const call = useVoiceCall();
  const { occupantsByChannel } = useVoiceOccupancy();
  const [isStarting, setStarting] = useState(false);
  const [isDismissed, setDismissed] = useState(false);
  const occupants = occupantsByChannel[conversationId] ?? [];
  const selfId = call.self?.userId ?? 0;
  const othersInRoom = occupants.filter((person) => person.userId !== selfId);
  const isThisCall = call.channel?.conversationId === conversationId;
  const isIncoming = !isThisCall && othersInRoom.length > 0 && !isDismissed;
  const roomPeerCount = (call.room?.participants ?? []).filter(
    (person) => person.userId !== selfId,
  ).length;
  const isCalling = isDirectCallWaiting({
    isJoined: isThisCall,
    isJoining: call.isJoining,
    livePeerCount: call.others.length,
    occupancyPeerCount: Math.max(othersInRoom.length, roomPeerCount),
  });
  const isConnected =
    isThisCall &&
    (call.others.length > 0 || othersInRoom.length > 0 || roomPeerCount > 0);
  const channel = {
    conversationId,
    channelName: conversationName,
    workspaceId,
    kind: "dm" as const,
  };

  useEffect(() => {
    if (othersInRoom.length === 0) {
      setDismissed(false);
    }
  }, [othersInRoom.length]);

  async function joinCall(logStart: boolean) {
    setStarting(true);
    setDismissed(false);
    try {
      const joined = await call.join(channel);
      if (joined && logStart) {
        await recordDirectCallStart(conversationId);
      }
    } finally {
      setStarting(false);
    }
  }

  return {
    isThisCall,
    isIncoming,
    isCalling,
    isConnected,
    hasVideo: isThisCall && isVideoCallActive([call.media, ...call.others]),
    isVisible: isThisCall || isIncoming || isStarting,
    isJoining: call.isJoining || isStarting,
    media: call.media,
    self: isThisCall || isStarting ? call.self : null,
    error: isThisCall || isStarting ? call.error : "",
    buttonLabel: isThisCall
      ? "Encerrar chamada"
      : isIncoming
        ? "Atender"
        : "Ligar",
    statusLabel(duration: string | null) {
      if (isStarting && !isThisCall) {
        return "Conectando...";
      }
      if (isIncoming) {
        return `${conversationName} está ligando`;
      }
      if (isConnected) {
        return duration ?? "Em chamada";
      }
      if (isCalling || isStarting) {
        return `Chamando ${conversationName}...`;
      }
      return "Em chamada";
    },
    toggleMic: call.toggleMic,
    toggleCamera: call.toggleCamera,
    hangup: call.leave,
    dismissIncoming() {
      setDismissed(true);
      forceStopVoiceRingtone();
    },
    accept: () => joinCall(false),
    async toggle() {
      if (isThisCall) {
        await call.leave();
        return;
      }

      await joinCall(!isIncoming);
    },
  };
}

function CallIconButton({
  label,
  isOff = false,
  isActive = false,
  onClick,
  children,
}: {
  label: string;
  isOff?: boolean;
  isActive?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  const tone = isOff
    ? "bg-red-600 text-white hover:bg-red-500"
    : isActive
      ? "bg-green-600 text-white hover:bg-green-500"
      : "bg-white text-zinc-700 hover:bg-zinc-100";

  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={`flex h-10 w-10 items-center justify-center rounded-full shadow-sm ${tone}`}
    >
      {children}
    </button>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M6 9c2 4 6 8 12 9l2-3-4-2-2 1c-2-1-4-3-5-5l1-2-2-4-3 2c.3 2 1 4 1 4Z" />
    </svg>
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

function CameraIcon({ off }: { off: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="3" y="7" width="12" height="10" rx="2" />
      <path d="m15 10 6-3v10l-6-3" />
      {off ? <path d="m4 4 16 16" /> : null}
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
