"use client";

import { useEffect, type RefObject } from "react";

const SPEAKING_THRESHOLD = 0.045;
const SMOOTHING = 0.65;
const SPEAKING_GREEN = "35, 165, 90";

export function useVoiceActivity(
  stream: MediaStream | undefined,
  isEnabled: boolean,
  tileRef: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    const tile = tileRef.current;
    const hasAudio = Boolean(stream?.getAudioTracks().length);
    if (!stream || !isEnabled || !hasAudio || !tile || typeof AudioContext === "undefined") {
      clearGlow(tile);
      return;
    }

    const context = new AudioContext();
    const source = context.createMediaStreamSource(stream);
    const analyser = context.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.4;
    source.connect(analyser);
    const samples = new Uint8Array(analyser.fftSize);
    let frame = 0;
    let smoothed = 0;

    function tick() {
      analyser.getByteTimeDomainData(samples);
      smoothed = smoothed * SMOOTHING + readRms(samples) * (1 - SMOOTHING);
      paintGlow(tile, smoothed);
      frame = window.requestAnimationFrame(tick);
    }

    void context.resume();
    frame = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(frame);
      source.disconnect();
      void context.close();
      clearGlow(tile);
    };
  }, [isEnabled, stream, tileRef]);
}

function readRms(samples: Uint8Array) {
  let total = 0;
  for (const sample of samples) {
    const value = (sample - 128) / 128;
    total += value * value;
  }
  return Math.sqrt(total / samples.length);
}

function paintGlow(tile: HTMLElement | null, level: number) {
  if (!tile) {
    return;
  }

  if (level < SPEAKING_THRESHOLD) {
    clearGlow(tile);
    return;
  }

  const intensity = Math.min(1, (level - SPEAKING_THRESHOLD) / 0.18);
  const width = 2 + intensity * 2;
  const glow = 8 + intensity * 18;
  const alpha = 0.45 + intensity * 0.45;
  tile.style.boxShadow = `inset 0 0 0 ${width}px rgb(${SPEAKING_GREEN}), 0 0 ${glow}px rgba(${SPEAKING_GREEN}, ${alpha})`;
}

function clearGlow(tile: HTMLElement | null) {
  if (tile) {
    tile.style.boxShadow = "inset 0 0 0 2px transparent";
  }
}
