"use client";

import { useEffect } from "react";
import { startVoiceRingtone, stopVoiceRingtone } from "./playVoiceChime";

export function useVoiceRingtone(shouldRing: boolean) {
  useEffect(() => {
    if (!shouldRing) {
      return;
    }

    startVoiceRingtone();
    return () => stopVoiceRingtone();
  }, [shouldRing]);
}
