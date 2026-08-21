"use client";

import { useEffect, useRef } from "react";
import type { VoiceParticipant } from "@/domain/VoiceRoom";
import { Avatar } from "./Avatar";
import { useVoiceActivity } from "./useVoiceActivity";

type ChatVoiceTileProps = {
  participant: VoiceParticipant;
  stream?: MediaStream;
  isSelf?: boolean;
  isDeafened?: boolean;
};

export function ChatVoiceTile({
  participant,
  stream,
  isSelf = false,
  isDeafened = false,
}: ChatVoiceTileProps) {
  const tileRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const canListen =
    Boolean(stream) && !participant.isMicMuted && !participant.isDeafened;
  useVoiceActivity(stream, canListen, tileRef);
  const hasVideo = Boolean(
    stream?.getVideoTracks().some((track) => track.enabled && track.readyState === "live"),
  );

  useEffect(() => {
    const video = videoRef.current;
    const audio = audioRef.current;
    if (video) {
      video.srcObject = hasVideo && stream ? stream : null;
    }
    if (audio) {
      audio.srcObject = !isSelf && stream ? stream : null;
      audio.muted = isDeafened;
    }
  }, [hasVideo, isDeafened, isSelf, stream]);

  return (
    <article ref={tileRef} className="relative rounded-2xl">
      <div className="relative flex min-h-48 w-full flex-col items-center justify-center overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100">
        {hasVideo ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={isSelf}
            className={`h-full w-full object-cover ${isSelf && !participant.isScreenSharing ? "scale-x-[-1]" : ""}`}
          />
        ) : (
          <Avatar
            name={participant.name}
            imageUrl={participant.imageUrl}
            size="xl"
            shape="circle"
          />
        )}
        {!isSelf ? <audio ref={audioRef} autoPlay /> : null}
        <div className="absolute bottom-3 left-3 flex items-center gap-2">
          <span className="rounded-md bg-white/90 px-2 py-1 text-xs font-medium text-zinc-800 shadow-sm">
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
