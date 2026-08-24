"use client";

import type { ReactNode } from "react";

type ChatVoiceCardControlsProps = {
  isMuted: boolean;
  isAudioOff: boolean;
  volume?: number;
  showVolume?: boolean;
  onToggleMuted: () => void;
  onToggleAudio: () => void;
  onVolume?: (volume: number) => void;
};

export function ChatVoiceCardControls({
  isMuted,
  isAudioOff,
  volume = 100,
  showVolume = false,
  onToggleMuted,
  onToggleAudio,
  onVolume,
}: ChatVoiceCardControlsProps) {
  return (
    <div className="absolute right-3 bottom-3 z-20 flex items-center gap-1.5 rounded-full bg-zinc-900/80 px-1.5 py-1">
      <CardButton
        label={isMuted ? "Ativar microfone" : "Silenciar"}
        isOff={isMuted}
        onClick={onToggleMuted}
      >
        <MicIcon muted={isMuted} />
      </CardButton>
      <CardButton
        label={isAudioOff ? "Ativar áudio" : "Desativar áudio"}
        isOff={isAudioOff}
        onClick={onToggleAudio}
      >
        <HeadphoneIcon off={isAudioOff} />
      </CardButton>
      {showVolume && onVolume ? (
        <label className="flex items-center px-1">
          <span className="sr-only">Volume do microfone</span>
          <input
            type="range"
            min={0}
            max={100}
            value={volume}
            onChange={(event) => onVolume(Number(event.target.value))}
            className="h-1 w-24 cursor-pointer accent-teal-500"
          />
        </label>
      ) : null}
    </div>
  );
}

function CardButton({
  label,
  isOff,
  onClick,
  children,
}: {
  label: string;
  isOff: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={`flex h-8 w-8 items-center justify-center rounded-full ${
        isOff ? "bg-red-600 text-white" : "text-zinc-50 hover:bg-zinc-50/10"
      }`}
    >
      {children}
    </button>
  );
}

function MicIcon({ muted }: { muted: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
      {muted ? <path d="m4 4 16 16" /> : null}
    </svg>
  );
}

function HeadphoneIcon({ off }: { off: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M4 13v3a2 2 0 0 0 2 2h1v-7H6a2 2 0 0 0-2 2Z" />
      <path d="M20 13v3a2 2 0 0 1-2 2h-1v-7h1a2 2 0 0 1 2 2Z" />
      <path d="M4 13a8 8 0 0 1 16 0" />
      {off ? <path d="m4 4 16 16" /> : null}
    </svg>
  );
}
