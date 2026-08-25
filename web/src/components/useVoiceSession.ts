"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { VoiceMediaState, VoiceSession } from "@/domain/VoiceRoom";
import { recordDirectCallEnd } from "./directCallLog";
import { joinVoiceRoomApi, leaveVoiceRoomApi } from "./voiceApi";

export function useVoiceSession() {
  const [session, setSession] = useState<VoiceSession | null>(null);
  const [error, setError] = useState("");
  const [isJoining, setJoining] = useState(false);
  const sessionRef = useRef<VoiceSession | null>(null);
  const joinGeneration = useRef(0);
  const pendingJoin = useRef<Promise<VoiceSession | null> | null>(null);
  const pendingConversationId = useRef(0);
  sessionRef.current = session;

  const join = useCallback(async (conversationId: number, media: VoiceMediaState) => {
    const current = sessionRef.current;
    if (current?.room.conversationId === conversationId) {
      setError("");
      return current;
    }

    if (pendingConversationId.current === conversationId && pendingJoin.current) {
      return pendingJoin.current;
    }

    const generation = ++joinGeneration.current;
    setJoining(true);
    setError("");

    const request = (async () => {
      try {
        const next = await joinVoiceRoomApi(conversationId, media);
        if (joinGeneration.current !== generation) {
          return null;
        }

        const previousId = current?.room.conversationId;
        if (previousId && previousId !== conversationId) {
          await leaveRoom(previousId);
        }

        sessionRef.current = next;
        setSession(next);
        return next;
      } catch (caught) {
        if (joinGeneration.current === generation) {
          setError(errorText(caught, "Não foi possível entrar na sala de voz."));
        }
        return null;
      } finally {
        if (joinGeneration.current === generation) {
          setJoining(false);
          pendingJoin.current = null;
          pendingConversationId.current = 0;
        }
      }
    })();

    pendingConversationId.current = conversationId;
    pendingJoin.current = request;
    return request;
  }, []);

  const leave = useCallback(async () => {
    joinGeneration.current += 1;
    pendingJoin.current = null;
    pendingConversationId.current = 0;
    const current = sessionRef.current;
    sessionRef.current = null;
    setSession(null);
    setError("");
    setJoining(false);
    if (!current) {
      return;
    }

    await leaveRoom(current.room.conversationId);
  }, []);

  useEffect(() => {
    function onPageHide() {
      const conversationId = sessionRef.current?.room.conversationId;
      if (conversationId) {
        void recordDirectCallEnd({ keepalive: true });
        void leaveRoom(conversationId, true);
      }
    }

    window.addEventListener("pagehide", onPageHide);
    return () => {
      window.removeEventListener("pagehide", onPageHide);
      const conversationId = sessionRef.current?.room.conversationId;
      if (conversationId) {
        void leaveRoom(conversationId);
      }
    };
  }, []);

  return { session, error, isJoining, join, leave };
}

async function leaveRoom(conversationId: number, keepalive = false) {
  try {
    await leaveVoiceRoomApi(conversationId, { keepalive });
  } catch (error) {
    console.error("Falha ao sair da sala de voz.", error);
  }
}

function errorText(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}
