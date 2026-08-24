"use client";

import { useEffect, type RefObject } from "react";

const SPEAKING_GREEN = "35, 165, 90";

export function useVoiceActivity(
  isSpeaking: boolean,
  tileRef: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    const tile = tileRef.current;
    if (!tile) {
      return;
    }

    if (isSpeaking) {
      tile.style.boxShadow = `inset 0 0 0 3px rgb(${SPEAKING_GREEN}), 0 0 16px rgba(${SPEAKING_GREEN}, 0.75)`;
    } else {
      clearGlow(tile);
    }

    return () => clearGlow(tile);
  }, [isSpeaking, tileRef]);
}

function clearGlow(tile: HTMLElement | null) {
  if (tile) {
    tile.style.boxShadow = "inset 0 0 0 2px transparent";
  }
}
