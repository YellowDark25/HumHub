"use client";

import { useCallback, useEffect, useState, type RefObject } from "react";

export function useCallFullscreen(target: RefObject<HTMLElement | null>) {
  const [isFullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    function sync() {
      setFullscreen(document.fullscreenElement === target.current);
    }

    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, [target]);

  const toggle = useCallback(async () => {
    const node = target.current;
    if (!node) {
      return;
    }

    try {
      if (document.fullscreenElement === node) {
        await document.exitFullscreen();
        return;
      }

      await node.requestFullscreen();
    } catch (error) {
      console.error("Não foi possível alternar a tela cheia.", error);
    }
  }, [target]);

  return { isFullscreen, toggle };
}
