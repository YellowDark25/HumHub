"use client";

import { useEffect, useState } from "react";
import type { VoiceOccupancyRoom } from "@/domain/VoiceRoom";
import { readApiError } from "@/shared/readApiError";
import {
  applyVoiceLiveEvent,
  readVoiceLiveEvent,
  VOICE_LIVE_POLL_MS,
  VOICE_LIVE_RECONNECT_MS,
} from "@/shared/voiceLive";

export function useVoiceOccupancyLive() {
  const [rooms, setRooms] = useState<VoiceOccupancyRoom[]>([]);

  useEffect(() => {
    let stopped = false;
    let source: EventSource | null = null;
    let pollTimer = 0;
    let reconnectTimer = 0;

    function applyRooms(next: VoiceOccupancyRoom[]) {
      if (!stopped) {
        setRooms(next);
      }
    }

    async function loadRooms() {
      const next = await fetchVoiceOccupancy();
      if (next) {
        applyRooms(next);
      }
    }

    function startPolling() {
      if (pollTimer || stopped) {
        return;
      }

      pollTimer = window.setInterval(() => {
        if (!document.hidden) {
          void loadRooms();
        }
      }, VOICE_LIVE_POLL_MS);
    }

    function stopPolling() {
      if (!pollTimer) {
        return;
      }

      window.clearInterval(pollTimer);
      pollTimer = 0;
    }

    function connectStream() {
      if (stopped || typeof EventSource === "undefined") {
        startPolling();
        return;
      }

      source = new EventSource("/api/chat/voice/stream");
      source.onmessage = (message) => {
        if (stopped) {
          return;
        }

        try {
          const event = readVoiceLiveEvent(JSON.parse(message.data));
          if (!event) {
            return;
          }

          stopPolling();
          setRooms((current) => applyVoiceLiveEvent(current, event));
        } catch (error) {
          console.error("Falha ao ler ocupação de voz.", error);
        }
      };
      source.onerror = () => {
        source?.close();
        source = null;
        startPolling();
        if (stopped || reconnectTimer) {
          return;
        }

        reconnectTimer = window.setTimeout(() => {
          reconnectTimer = 0;
          connectStream();
        }, VOICE_LIVE_RECONNECT_MS);
      };
    }

    function onVisibility() {
      if (!document.hidden && pollTimer) {
        void loadRooms();
      }
    }

    void loadRooms();
    connectStream();
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stopped = true;
      source?.close();
      stopPolling();
      if (reconnectTimer) {
        window.clearTimeout(reconnectTimer);
      }
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return rooms;
}

async function fetchVoiceOccupancy(): Promise<VoiceOccupancyRoom[] | null> {
  try {
    const response = await fetch("/api/chat/voice");
    if (!response.ok) {
      console.error(
        await readApiError(response, "Não foi possível carregar quem está em voz."),
      );
      return null;
    }

    const payload = (await response.json()) as { rooms?: VoiceOccupancyRoom[] };
    return payload.rooms ?? [];
  } catch (error) {
    console.error("Falha de rede ao carregar quem está em chamada.", error);
    return null;
  }
}
