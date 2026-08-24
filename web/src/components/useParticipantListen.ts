"use client";

import { useCallback, useEffect, useState } from "react";
import {
  clampVoiceVolume,
  DEFAULT_VOICE_LISTEN,
  readVoiceListen,
  type VoiceListenState,
} from "@/domain/VoiceRoom";

const STORAGE_KEY = "nexhub-voice-listen";

type ListenMap = Record<number, VoiceListenState>;

const listeners = new Set<(map: ListenMap) => void>();

function publish(next: ListenMap) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  listeners.forEach((listen) => listen(next));
}

function updateUser(
  userId: number,
  change: (current: VoiceListenState) => VoiceListenState,
) {
  const current = readMap();
  publish({
    ...current,
    [userId]: change(current[userId] ?? DEFAULT_VOICE_LISTEN),
  });
}

export function useParticipantListenMap() {
  const [map, setMap] = useState<ListenMap>({});

  useEffect(() => {
    setMap(readMap());
    listeners.add(setMap);
    return () => {
      listeners.delete(setMap);
    };
  }, []);

  return map;
}

export function useParticipantListen(userId: number) {
  const map = useParticipantListenMap();
  const listen = map[userId] ?? DEFAULT_VOICE_LISTEN;

  const toggleMuted = useCallback(() => {
    updateUser(userId, (current) => ({
      ...current,
      isMuted: !current.isMuted,
    }));
  }, [userId]);

  const toggleAudioOff = useCallback(() => {
    updateUser(userId, (current) => ({
      ...current,
      isAudioOff: !current.isAudioOff,
    }));
  }, [userId]);

  const setVolume = useCallback((volume: number) => {
    updateUser(userId, (current) => ({
      ...current,
      volume: clampVoiceVolume(volume),
    }));
  }, [userId]);

  return { listen, toggleMuted, toggleAudioOff, setVolume };
}

function readMap(): ListenMap {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw) as Record<string, Partial<VoiceListenState>>;
    return Object.fromEntries(
      Object.entries(parsed)
        .map(([id, value]) => [Number(id), readVoiceListen(value)] as const)
        .filter(([id]) => Number.isFinite(id) && id > 0),
    );
  } catch {
    return {};
  }
}
