"use client";

import { useEffect, useRef, useState } from "react";
import type { VoiceMediaState, VoiceRoom } from "@/domain/VoiceRoom";
import {
  VOICE_HEARTBEAT_MS,
  heartbeatVoiceRoomApi,
  joinVoiceRoomApi,
  leaveVoiceRoomApi,
} from "./voiceApi";

export function useVoicePresence(
  conversationId: number,
  media: VoiceMediaState,
  enabled: boolean,
) {
  const [room, setRoom] = useState<VoiceRoom | null>(null);
  const [error, setError] = useState("");
  const mediaRef = useRef(media);
  const joinedRef = useRef(false);
  mediaRef.current = media;

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let cancelled = false;

    async function connect() {
      try {
        const joined = await joinVoiceRoomApi(conversationId, mediaRef.current);
        if (!cancelled) {
          joinedRef.current = true;
          setRoom(joined);
          setError("");
        }
      } catch (caught) {
        if (!cancelled) {
          setError(errorText(caught, "Não foi possível entrar na sala de voz."));
        }
      }
    }

    void connect();

    const heartbeat = window.setInterval(() => {
      void heartbeatVoiceRoomApi(conversationId, mediaRef.current)
        .then((next) => {
          if (!cancelled) {
            setRoom(next);
          }
        })
        .catch((caught) => {
          if (!cancelled) {
            setError(errorText(caught, "A conexão de voz caiu."));
          }
        });
    }, VOICE_HEARTBEAT_MS);

    return () => {
      cancelled = true;
      joinedRef.current = false;
      window.clearInterval(heartbeat);
      void leaveVoiceRoomApi(conversationId);
    };
  }, [conversationId, enabled]);

  useEffect(() => {
    if (!enabled || !joinedRef.current) {
      return;
    }

    void heartbeatVoiceRoomApi(conversationId, media)
      .then(setRoom)
      .catch(() => undefined);
  }, [conversationId, enabled, media]);

  return { room, error };
}

function errorText(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}
