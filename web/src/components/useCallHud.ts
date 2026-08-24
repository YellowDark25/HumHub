"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const CALL_HUD_IDLE_MS = 3000;

export function useCallHud(isPinned = false) {
  const [isVisible, setVisible] = useState(true);
  const timerRef = useRef(0);

  const reveal = useCallback(() => {
    setVisible(true);
    window.clearTimeout(timerRef.current);
    if (!isPinned) {
      timerRef.current = window.setTimeout(() => {
        setVisible(false);
      }, CALL_HUD_IDLE_MS);
    }
  }, [isPinned]);

  useEffect(() => {
    reveal();
    return () => window.clearTimeout(timerRef.current);
  }, [reveal]);

  return { isVisible, reveal };
}
