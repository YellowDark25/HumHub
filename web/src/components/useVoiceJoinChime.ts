"use client";

import { useEffect, useRef } from "react";
import { playVoiceJoinChime } from "./playVoiceChime";

export function useVoiceJoinChime(isConnected: boolean, otherUserIds: number[]) {
  const wasConnected = useRef(false);
  const knownIds = useRef<Set<number>>(new Set());
  const othersRef = useRef(otherUserIds);
  othersRef.current = otherUserIds;
  const othersKey = otherUserIds.join(",");

  useEffect(() => {
    const others = othersRef.current;
    if (!isConnected) {
      wasConnected.current = false;
      knownIds.current = new Set();
      return;
    }

    if (!wasConnected.current) {
      playVoiceJoinChime();
      knownIds.current = new Set(others);
      wasConnected.current = true;
      return;
    }

    for (const userId of others) {
      if (!knownIds.current.has(userId)) {
        playVoiceJoinChime();
        break;
      }
    }
    knownIds.current = new Set(others);
  }, [isConnected, othersKey]);
}
