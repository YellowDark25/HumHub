"use client";

import type { User } from "@/domain/User";
import type { VoiceParticipant } from "@/domain/VoiceRoom";
import { useRef, type ReactNode } from "react";
import { ChatVoiceCardControls } from "./ChatVoiceCardControls";
import { ChatVoiceControls } from "./ChatVoiceControls";
import { ChatVoiceTile } from "./ChatVoiceTile";
import { useCallFullscreen } from "./useCallFullscreen";
import { useCallHud } from "./useCallHud";
import { useParticipantListen } from "./useParticipantListen";
import { useVoiceCall } from "./useVoiceCall";

type ChatVoiceStageProps = {
  conversationId: number;
  title: ReactNode;
  currentUser: Pick<User, "id" | "name" | "imageUrl">;
  headerTrailing?: ReactNode;
  inviteModal?: ReactNode;
  onLeave: () => void;
  onInvite?: () => void;
};

export function ChatVoiceStage({
  conversationId,
  title,
  currentUser,
  headerTrailing,
  inviteModal,
  onLeave,
  onInvite,
}: ChatVoiceStageProps) {
  const stageRef = useRef<HTMLElement>(null);
  const call = useVoiceCall();
  const hud = useCallHud(Boolean(inviteModal));
  const fullscreen = useCallFullscreen(stageRef);
  const isThisRoom = call.room?.conversationId === conversationId;
  const others = isThisRoom ? call.others : [];
  const self = call.self ?? {
    userId: currentUser.id,
    name: currentUser.name,
    imageUrl: currentUser.imageUrl,
    joinedAt: 0,
    ...call.media,
  };

  return (
    <section
      ref={stageRef}
      className={`relative flex h-full min-h-0 flex-1 flex-col bg-zinc-100 text-zinc-900 ${
        fullscreen.isFullscreen && !hud.isVisible ? "cursor-none" : ""
      }`}
      onMouseMove={hud.reveal}
      onPointerDown={hud.reveal}
      onFocusCapture={hud.reveal}
    >
      <div
        className={`grid min-h-0 flex-1 place-content-center justify-items-center gap-3 px-6 pt-16 pb-28 ${
          others.length === 0 ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"
        }`}
      >
        {call.error ? (
          <p className="absolute top-16 left-1/2 z-10 -translate-x-1/2 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
            {call.error}
          </p>
        ) : null}

        <ChatVoiceTile
          participant={self}
          stream={call.stream ?? undefined}
          isSelf
          isSpeaking={call.speakingIds.includes(self.userId)}
          controls={
            hud.isVisible ? (
              <ChatVoiceCardControls
                isMuted={call.media.isMicMuted}
                isAudioOff={call.media.isDeafened}
                onToggleMuted={call.toggleMic}
                onToggleAudio={call.toggleDeafen}
              />
            ) : null
          }
        />
        {others.map((participant) => (
          <RemoteVoiceTile
            key={participant.userId}
            participant={participant}
            stream={call.remoteStreams[participant.userId]}
            isSpeaking={call.speakingIds.includes(participant.userId)}
            showControls={hud.isVisible}
          />
        ))}
      </div>

      <div
        className={`pointer-events-none absolute inset-0 z-10 flex flex-col justify-between transition-opacity duration-300 ${
          hud.isVisible ? "opacity-100" : "opacity-0"
        }`}
        aria-hidden={!hud.isVisible}
      >
        <header className="pointer-events-auto flex h-14 items-center justify-between gap-3 bg-linear-to-b from-zinc-100 to-transparent px-4">
          <h1 className="flex min-w-0 items-center gap-2 truncate text-[15px] font-semibold">
            {title}
          </h1>
          <div className="flex items-center gap-3">
            <p className="text-sm text-zinc-500">
              {isThisRoom
                ? `${call.room?.participants.length ?? 1} em chamada`
                : "Entrando..."}
            </p>
            {headerTrailing}
          </div>
        </header>

        <div className="flex justify-center bg-linear-to-t from-zinc-100 to-transparent px-4 py-4">
          <div className="pointer-events-auto">
            <ChatVoiceControls
              media={call.media}
              isFullscreen={fullscreen.isFullscreen}
              onToggleMic={call.toggleMic}
              onToggleCamera={() => void call.toggleCamera()}
              onToggleScreen={() => void call.toggleScreenShare()}
              onInvite={onInvite}
              onToggleFullscreen={() => void fullscreen.toggle()}
              onLeave={onLeave}
            />
          </div>
        </div>
      </div>

      {inviteModal}
    </section>
  );
}

function RemoteVoiceTile({
  participant,
  stream,
  isSpeaking,
  showControls,
}: {
  participant: VoiceParticipant;
  stream?: MediaStream;
  isSpeaking: boolean;
  showControls: boolean;
}) {
  const { listen, toggleMuted, toggleAudioOff, setVolume } = useParticipantListen(
    participant.userId,
  );

  return (
    <ChatVoiceTile
      participant={participant}
      stream={stream}
      isSpeaking={isSpeaking}
      controls={
        showControls ? (
          <ChatVoiceCardControls
            isMuted={listen.isMuted}
            isAudioOff={listen.isAudioOff}
            volume={listen.volume}
            showVolume
            onToggleMuted={toggleMuted}
            onToggleAudio={toggleAudioOff}
            onVolume={setVolume}
          />
        ) : null
      }
    />
  );
}
