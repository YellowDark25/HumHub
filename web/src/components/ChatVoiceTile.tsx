"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { voiceCardTone, type VoiceParticipant } from "@/domain/VoiceRoom";
import { attachMediaStream, detachMediaStream } from "./attachMediaStream";
import { Avatar } from "./Avatar";
import { useVoiceActivity } from "./useVoiceActivity";

const VOICE_CARD_TONES = [
  "bg-rose-800",
  "bg-indigo-800",
  "bg-emerald-800",
  "bg-amber-800",
  "bg-sky-800",
  "bg-violet-800",
  "bg-orange-800",
  "bg-cyan-800",
] as const;

type ChatVoiceTileProps = {
  participant: VoiceParticipant;
  stream?: MediaStream;
  isSelf?: boolean;
  isSpeaking?: boolean;
  controls?: ReactNode;
};

export function ChatVoiceTile({
  participant,
  stream,
  isSelf = false,
  isSpeaking = false,
  controls,
}: ChatVoiceTileProps) {
  const tileRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  useVoiceActivity(isSpeaking, tileRef);
  const hasVideo = Boolean(
    stream?.getVideoTracks().some((track) => track.enabled && track.readyState === "live"),
  );

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    const next = hasVideo && stream ? stream : null;
    attachMediaStream(video, next);
    return () => detachMediaStream(video, next);
  }, [hasVideo, stream]);

  return (
    <article ref={tileRef} className="relative aspect-video w-full max-w-lg rounded-2xl">
      <div
        className={`absolute inset-0 flex flex-col items-center justify-center overflow-hidden rounded-2xl ${
          VOICE_CARD_TONES[voiceCardTone(participant.userId)]
        }`}
      >
        <video
          ref={videoRef}
          playsInline
          muted={isSelf}
          className={`h-full w-full object-cover ${hasVideo ? "" : "hidden"} ${
            isSelf && !participant.isScreenSharing ? "scale-x-[-1]" : ""
          }`}
        />
        {hasVideo ? null : (
          <Avatar
            name={participant.name}
            imageUrl={participant.imageUrl}
            size="lg"
            shape="circle"
          />
        )}
        <div className="absolute bottom-3 left-3 flex items-center gap-2">
          <span className="rounded-md bg-zinc-900/75 px-2 py-1 text-sm font-medium text-zinc-50">
            {isSelf ? `${participant.name} (você)` : participant.name}
          </span>
          {participant.isMicMuted || participant.isDeafened ? (
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-white">
              <MicOffIcon />
            </span>
          ) : null}
        </div>
        {participant.isScreenSharing ? (
          <span className="absolute top-3 left-3 rounded-md bg-teal-700 px-2 py-1 text-[11px] font-medium text-white">
            Compartilhando tela
          </span>
        ) : null}
        {controls}
      </div>
    </article>
  );
}

function MicOffIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3M4 4l16 16" />
    </svg>
  );
}
