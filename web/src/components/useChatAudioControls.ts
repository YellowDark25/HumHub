"use client";

import { useEffect, useState } from "react";
import { browserMediaBlockedMessage, canCaptureBrowserMedia } from "@/shared/browserMedia";

const STORAGE_KEY = "nexhub-chat-audio";

export type ChatAudioDevice = {
  id: string;
  label: string;
};

type ChatAudioPrefs = {
  isMicMuted: boolean;
  isDeafened: boolean;
  inputDeviceId: string;
  outputDeviceId: string;
  inputVolume: number;
  outputVolume: number;
  inputProfile: string;
};

const DEFAULT_PREFS: ChatAudioPrefs = {
  isMicMuted: false,
  isDeafened: false,
  inputDeviceId: "",
  outputDeviceId: "",
  inputVolume: 100,
  outputVolume: 100,
  inputProfile: "Padrão",
};

export const INPUT_PROFILES = ["Padrão", "Personalizado"] as const;

const listeners = new Set<(prefs: ChatAudioPrefs) => void>();

function publishPrefs(next: ChatAudioPrefs) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  listeners.forEach((listen) => listen(next));
}

export function useChatAudioControls() {
  const [prefs, setPrefs] = useState<ChatAudioPrefs>(DEFAULT_PREFS);
  const [inputs, setInputs] = useState<ChatAudioDevice[]>([]);
  const [outputs, setOutputs] = useState<ChatAudioDevice[]>([]);
  const [deviceError, setDeviceError] = useState("");

  useEffect(() => {
    setPrefs(readPrefs());
    listeners.add(setPrefs);

    function syncFromStorage(event: StorageEvent) {
      if (event.key === STORAGE_KEY) {
        setPrefs(readPrefs());
      }
    }

    window.addEventListener("storage", syncFromStorage);
    return () => {
      listeners.delete(setPrefs);
      window.removeEventListener("storage", syncFromStorage);
    };
  }, []);

  function savePrefs(next: ChatAudioPrefs) {
    publishPrefs(next);
  }

  function toggleMic() {
    if (prefs.isDeafened) {
      savePrefs({ ...prefs, isDeafened: false, isMicMuted: false });
      return;
    }

    savePrefs({ ...prefs, isMicMuted: !prefs.isMicMuted });
  }

  function toggleDeafen() {
    const nextDeafened = !prefs.isDeafened;
    savePrefs({
      ...prefs,
      isDeafened: nextDeafened,
      isMicMuted: nextDeafened ? true : false,
    });
  }

  function selectInput(deviceId: string) {
    savePrefs({ ...prefs, inputDeviceId: deviceId });
  }

  function selectOutput(deviceId: string) {
    savePrefs({ ...prefs, outputDeviceId: deviceId });
  }

  function setInputVolume(inputVolume: number) {
    savePrefs({ ...prefs, inputVolume: clampVolume(inputVolume) });
  }

  function setOutputVolume(outputVolume: number) {
    savePrefs({ ...prefs, outputVolume: clampVolume(outputVolume) });
  }

  function setInputProfile(inputProfile: string) {
    savePrefs({ ...prefs, inputProfile });
  }

  async function loadDevices() {
    setDeviceError("");

    if (!canCaptureBrowserMedia()) {
      setDeviceError(browserMediaBlockedMessage());
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      const devices = await navigator.mediaDevices.enumerateDevices();
      setInputs(namedDevices(devices, "audioinput", "Microfone"));
      setOutputs(namedDevices(devices, "audiooutput", "Alto-falante"));
    } catch {
      setDeviceError("Não foi possível listar os dispositivos de áudio.");
    }
  }

  return {
    ...prefs,
    inputs,
    outputs,
    deviceError,
    toggleMic,
    toggleDeafen,
    selectInput,
    selectOutput,
    setInputVolume,
    setOutputVolume,
    setInputProfile,
    loadDevices,
  };
}

function clampVolume(value: number) {
  return Math.min(100, Math.max(0, value));
}

function namedDevices(
  devices: MediaDeviceInfo[],
  kind: MediaDeviceKind,
  fallback: string,
): ChatAudioDevice[] {
  return devices
    .filter((device) => device.kind === kind)
    .map((device, index) => ({
      id: device.deviceId,
      label: device.label || `${fallback} ${index + 1}`,
    }));
}

function readPrefs(): ChatAudioPrefs {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return DEFAULT_PREFS;
    }

    const parsed = JSON.parse(raw) as Partial<ChatAudioPrefs>;
    return {
      isMicMuted: Boolean(parsed.isMicMuted),
      isDeafened: Boolean(parsed.isDeafened),
      inputDeviceId: parsed.inputDeviceId ?? "",
      outputDeviceId: parsed.outputDeviceId ?? "",
      inputVolume: clampVolume(Number(parsed.inputVolume ?? 100)),
      outputVolume: clampVolume(Number(parsed.outputVolume ?? 100)),
      inputProfile: parsed.inputProfile || "Padrão",
    };
  } catch {
    return DEFAULT_PREFS;
  }
}
