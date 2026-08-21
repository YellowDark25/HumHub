"use client";

import { useEffect, useRef, useState } from "react";

const MAX_VOICE_SECONDS = 120;

export function useChatVoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [error, setError] = useState("");
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number>(0);

  useEffect(() => {
    return () => {
      stopTracks();
      window.clearInterval(timerRef.current);
    };
  }, []);

  async function start(): Promise<void> {
    setError("");
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("Este navegador não permite gravar áudio.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = pickAudioType();
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      chunksRef.current = [];
      streamRef.current = stream;
      mediaRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      recorder.start();
      setElapsedSeconds(0);
      setIsRecording(true);
      timerRef.current = window.setInterval(() => {
        setElapsedSeconds((current) => {
          if (current >= MAX_VOICE_SECONDS) {
            window.clearInterval(timerRef.current);
            return MAX_VOICE_SECONDS;
          }
          return current + 1;
        });
      }, 1000);
    } catch {
      setError("Não foi possível acessar o microfone. Verifique a permissão do navegador.");
    }
  }

  async function stop(): Promise<File | null> {
    const recorder = mediaRef.current;
    if (!recorder || recorder.state === "inactive") {
      finishRecording();
      return null;
    }

    const file = await new Promise<File | null>((resolve) => {
      recorder.onstop = () => {
        const type = recorder.mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type });
        finishRecording();
        if (blob.size === 0) {
          resolve(null);
          return;
        }
        resolve(new File([blob], voiceFileName(type), { type }));
      };
      recorder.stop();
    });

    return file;
  }

  function cancel(): void {
    const recorder = mediaRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.onstop = () => finishRecording();
      recorder.stop();
      return;
    }
    finishRecording();
  }

  function finishRecording() {
    window.clearInterval(timerRef.current);
    stopTracks();
    mediaRef.current = null;
    chunksRef.current = [];
    setIsRecording(false);
    setElapsedSeconds(0);
  }

  function stopTracks() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  return {
    isRecording,
    elapsedSeconds,
    error,
    start,
    stop,
    cancel,
  };
}

function pickAudioType(): string {
  const types = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg"];
  return types.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
}

function voiceFileName(type: string): string {
  const extension = type.includes("ogg") ? "ogg" : "webm";
  return `audio-${Date.now()}.${extension}`;
}
