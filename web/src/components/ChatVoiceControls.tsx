"use client";

import type { VoiceMediaState } from "@/domain/VoiceRoom";
import type { ReactNode } from "react";

type ChatVoiceControlsProps = {
  media: VoiceMediaState;
  isFullscreen: boolean;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onToggleScreen: () => void;
  onInvite?: () => void;
  onToggleFullscreen: () => void;
  onLeave: () => void;
};

export function ChatVoiceControls({
  media,
  isFullscreen,
  onToggleMic,
  onToggleCamera,
  onToggleScreen,
  onInvite,
  onToggleFullscreen,
  onLeave,
}: ChatVoiceControlsProps) {
  return (
    <div className="flex items-center justify-center gap-2">
      <ControlGroup>
        <ControlButton
          label={media.isMicMuted ? "Ativar microfone" : "Silenciar microfone"}
          isOff={media.isMicMuted}
          onClick={onToggleMic}
        >
          <MicIcon muted={media.isMicMuted} />
        </ControlButton>
        <ControlButton
          label={media.isCameraOn ? "Desligar câmera" : "Ligar câmera"}
          isOff={!media.isCameraOn}
          onClick={onToggleCamera}
        >
          <CameraIcon off={!media.isCameraOn} />
        </ControlButton>
      </ControlGroup>
      <ControlGroup>
        <ControlButton
          label={media.isScreenSharing ? "Parar compartilhamento" : "Compartilhar tela"}
          isActive={media.isScreenSharing}
          onClick={onToggleScreen}
        >
          <ScreenIcon />
        </ControlButton>
        {onInvite ? (
          <ControlButton label="Adicionar pessoas" onClick={onInvite}>
            <AddPeopleIcon />
          </ControlButton>
        ) : null}
        <ControlButton
          label={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
          isActive={isFullscreen}
          onClick={onToggleFullscreen}
        >
          <FullscreenIcon exit={isFullscreen} />
        </ControlButton>
      </ControlGroup>
      <button
        type="button"
        title="Sair da chamada"
        aria-label="Sair da chamada"
        onClick={onLeave}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600 text-white shadow-lg hover:bg-red-500"
      >
        <LeaveIcon />
      </button>
    </div>
  );
}

function ControlGroup({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-1 rounded-full bg-white px-1.5 py-1.5 shadow-lg">
      {children}
    </div>
  );
}

function ControlButton({
  label,
  isOff = false,
  isActive = false,
  onClick,
  children,
}: {
  label: string;
  isOff?: boolean;
  isActive?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  const tone = isOff
    ? "bg-red-600 text-white hover:bg-red-500"
    : isActive
      ? "bg-teal-600 text-white hover:bg-teal-500"
      : "text-zinc-700 hover:bg-zinc-200";

  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={`flex h-11 w-11 items-center justify-center rounded-full ${tone}`}
    >
      {children}
    </button>
  );
}

function MicIcon({ muted }: { muted: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
      {muted ? <path d="m4 4 16 16" /> : null}
    </svg>
  );
}

function CameraIcon({ off }: { off: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="3" y="7" width="12" height="10" rx="2" />
      <path d="m15 10 6-3v10l-6-3" />
      {off ? <path d="m4 4 16 16" /> : null}
    </svg>
  );
}

function AddPeopleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="9" cy="8" r="3" />
      <path d="M3 19a6 6 0 0 1 12 0" />
      <path d="M19 8v6M16 11h6" />
    </svg>
  );
}

function FullscreenIcon({ exit }: { exit: boolean }) {
  if (exit) {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M9 3v6H3M15 3v6h6M9 21v-6H3M15 21v-6h6" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5" />
    </svg>
  );
}

function ScreenIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8M12 16v4" />
    </svg>
  );
}

function LeaveIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M6 9c2 4 6 8 12 9l2-3-4-2-2 1c-2-1-4-3-5-5l1-2-2-4-3 2c.3 2 1 4 1 4Z" />
    </svg>
  );
}
