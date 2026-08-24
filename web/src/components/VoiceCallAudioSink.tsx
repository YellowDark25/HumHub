"use client";

import { useEffect, useRef } from "react";
import { DEFAULT_VOICE_LISTEN } from "@/domain/VoiceRoom";
import { useParticipantListenMap } from "./useParticipantListen";

type VoiceCallAudioSinkProps = {
  streams: Record<number, MediaStream>;
  isDeafened: boolean;
};

export function VoiceCallAudioSink({ streams, isDeafened }: VoiceCallAudioSinkProps) {
  const listenMap = useParticipantListenMap();
  const entries = Object.entries(streams);

  if (entries.length === 0) {
    return null;
  }

  return (
    <div hidden>
      {entries.map(([userId, stream]) => {
        const listen = listenMap[Number(userId)] ?? DEFAULT_VOICE_LISTEN;
        return (
          <RemoteAudio
            key={userId}
            stream={stream}
            muted={isDeafened || listen.isMuted || listen.isAudioOff}
            volume={listen.volume}
          />
        );
      })}
    </div>
  );
}

function RemoteAudio({
  stream,
  muted,
  volume,
}: {
  stream: MediaStream;
  muted: boolean;
  volume: number;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    if (audio.srcObject !== stream) {
      audio.srcObject = stream;
      void audio.play().catch((error) => {
        console.error("Falha ao reproduzir áudio da chamada.", error);
      });
    }

    return () => {
      if (audio.srcObject === stream) {
        audio.srcObject = null;
      }
    };
  }, [stream]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    audio.muted = muted;
    audio.volume = volume / 100;
  }, [muted, volume]);

  return <audio ref={audioRef} autoPlay />;
}
