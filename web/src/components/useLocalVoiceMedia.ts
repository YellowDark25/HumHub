"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { VoiceMediaState } from "@/domain/VoiceRoom";
import { useChatAudioControls } from "./useChatAudioControls";
import { unlockVoiceChimes } from "./playVoiceChime";

export function useLocalVoiceMedia() {
  const audio = useChatAudioControls();
  const streamRef = useRef<MediaStream | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [mediaVersion, setMediaVersion] = useState(0);
  const [isCameraOn, setCameraOn] = useState(false);
  const [isScreenSharing, setScreenSharing] = useState(false);
  const [isReady, setReady] = useState(false);
  const [error, setError] = useState("");

  const publish = useCallback(() => {
    const current = ensureStream(streamRef);
    setStream(current);
    setMediaVersion((version) => version + 1);
  }, []);

  useEffect(() => {
    const current = ensureStream(streamRef);
    let cancelled = false;

    async function startAudio() {
      try {
        const media = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) {
          media.getTracks().forEach((track) => track.stop());
          return;
        }
        replaceKind(current, media.getAudioTracks(), "audio");
        unlockVoiceChimes();
        publish();
      } catch {
        if (!cancelled) {
          setError("Não foi possível acessar o microfone.");
        }
      } finally {
        if (!cancelled) {
          setReady(true);
        }
      }
    }

    void startAudio();
    return () => {
      cancelled = true;
      current.getTracks().forEach((track) => track.stop());
    };
  }, [publish]);

  useEffect(() => {
    if (!stream) {
      return;
    }

    const live = !audio.isMicMuted && !audio.isDeafened;
    stream.getAudioTracks().forEach((track) => {
      track.enabled = live;
    });
  }, [audio.isDeafened, audio.isMicMuted, stream]);

  const toggleCamera = useCallback(async () => {
    setError("");
    const current = ensureStream(streamRef);
    if (isCameraOn) {
      stopKind(current, "video");
      setCameraOn(false);
      publish();
      return;
    }

    try {
      stopKind(current, "video");
      setScreenSharing(false);
      const media = await navigator.mediaDevices.getUserMedia({ video: true });
      replaceKind(current, media.getVideoTracks(), "video");
      setCameraOn(true);
      publish();
    } catch {
      setError("Não foi possível ligar a câmera.");
    }
  }, [isCameraOn, publish]);

  const toggleScreenShare = useCallback(async () => {
    setError("");
    const current = ensureStream(streamRef);
    if (isScreenSharing) {
      stopKind(current, "video");
      setScreenSharing(false);
      publish();
      return;
    }

    try {
      stopKind(current, "video");
      setCameraOn(false);
      const media = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });
      const [screen] = media.getVideoTracks();
      if (!screen) {
        return;
      }
      screen.addEventListener("ended", () => {
        stopKind(ensureStream(streamRef), "video");
        setScreenSharing(false);
        publish();
      });
      replaceKind(current, [screen], "video");
      setScreenSharing(true);
      publish();
    } catch {
      setError("Não foi possível compartilhar a tela.");
    }
  }, [isScreenSharing, publish]);

  const media: VoiceMediaState = useMemo(
    () => ({
      isMicMuted: audio.isMicMuted,
      isDeafened: audio.isDeafened,
      isCameraOn,
      isScreenSharing,
    }),
    [audio.isDeafened, audio.isMicMuted, isCameraOn, isScreenSharing],
  );

  return {
    stream,
    mediaVersion,
    media,
    isReady,
    error,
    toggleMic: audio.toggleMic,
    toggleDeafen: audio.toggleDeafen,
    toggleCamera,
    toggleScreenShare,
  };
}

function ensureStream(streamRef: { current: MediaStream | null }): MediaStream {
  if (!streamRef.current) {
    streamRef.current = new MediaStream();
  }
  return streamRef.current;
}

function stopKind(stream: MediaStream, kind: MediaStreamTrack["kind"]) {
  stream.getTracks().forEach((track) => {
    if (track.kind === kind) {
      track.stop();
      stream.removeTrack(track);
    }
  });
}

function replaceKind(
  stream: MediaStream,
  tracks: MediaStreamTrack[],
  kind: MediaStreamTrack["kind"],
) {
  stopKind(stream, kind);
  tracks.forEach((track) => stream.addTrack(track));
}
