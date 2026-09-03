"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { User } from "@/domain/User";
import Link from "next/link";
import { Avatar } from "./Avatar";
import { OnlineStatusBadge } from "./OnlineStatusBadge";
import {
  INPUT_PROFILES,
  useChatAudioControls,
  type ChatAudioDevice,
} from "./useChatAudioControls";

type ChatUserPanelProps = {
  user: User;
};

type VoiceMenu = "input" | "output" | "";
type VoiceSubmenu = "device" | "profile" | "";

/**
 * Barra de voz e áudio do usuário logado, sob o rail e a lista de canais.
 * Mostra avatar, mute/ensurdecer e os menus de dispositivo; o card arredondado
 * ocupa a largura inteira da coluna esquerda.
 */
export function ChatUserPanel({ user }: ChatUserPanelProps) {
  const audio = useChatAudioControls();
  const [openMenu, setOpenMenu] = useState<VoiceMenu>("");
  const [submenu, setSubmenu] = useState<VoiceSubmenu>("");
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpenMenu("");
        setSubmenu("");
      }
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  async function openVoiceMenu(menu: VoiceMenu) {
    if (openMenu === menu) {
      setOpenMenu("");
      setSubmenu("");
      return;
    }

    await audio.loadDevices();
    setSubmenu("");
    setOpenMenu(menu);
  }

  return (
    <div
      ref={rootRef}
      className="relative mx-2 mb-2 rounded-xl border border-zinc-200 bg-zinc-200/80 px-2 py-2"
    >
      <div className="flex items-center gap-1">
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-1 py-0.5">
          <span className="relative shrink-0">
            <Avatar name={user.name} imageUrl={user.imageUrl} size="sm" shape="circle" />
            <OnlineStatusBadge
              isOnline={user.isOnline}
              showWhenOffline
              ringClass="ring-zinc-200"
            />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold leading-5 text-zinc-900">
              {user.name}
            </span>
            <span className="block truncate text-xs leading-4 text-zinc-500">
              {user.username ? `@${user.username}` : statusLabel(audio.isDeafened, audio.isMicMuted, user)}
            </span>
          </span>
        </div>
        <ControlGroup>
          <IconButton
            label={audio.isMicMuted ? "Ativar microfone" : "Silenciar microfone"}
            isOff={audio.isMicMuted}
            onClick={audio.toggleMic}
          >
            <MicIcon muted={audio.isMicMuted} />
          </IconButton>
          <ChevronButton
            open={openMenu === "input"}
            onClick={() => void openVoiceMenu("input")}
          />
        </ControlGroup>
        <ControlGroup>
          <IconButton
            label={audio.isDeafened ? "Ativar áudio" : "Desativar áudio"}
            isOff={audio.isDeafened}
            onClick={audio.toggleDeafen}
          >
            <HeadphoneIcon deafened={audio.isDeafened} />
          </IconButton>
          <ChevronButton
            open={openMenu === "output"}
            onClick={() => void openVoiceMenu("output")}
          />
        </ControlGroup>
        <Link
          href="/configuracoes"
          title="Configurações"
          aria-label="Configurações"
          className="flex h-9 w-9 items-center justify-center rounded-md text-zinc-600 hover:bg-zinc-300/70"
        >
          <GearIcon />
        </Link>
      </div>
      {openMenu === "input" ? (
        <VoicePopover
          title="Dispositivo de entrada"
          deviceLabel={deviceLabel(audio.inputs, audio.inputDeviceId, "Padrão do sistema")}
          volumeLabel="Volume de entrada"
          volume={audio.inputVolume}
          onVolumeChange={audio.setInputVolume}
          submenu={submenu}
          onToggleDevice={() => setSubmenu(submenu === "device" ? "" : "device")}
          extraRow={{
            title: "Perfil de entrada",
            value: audio.inputProfile,
            onToggle: () => setSubmenu(submenu === "profile" ? "" : "profile"),
          }}
          devices={audio.inputs}
          selectedDeviceId={audio.inputDeviceId}
          onSelectDevice={audio.selectInput}
          profiles={submenu === "profile" ? [...INPUT_PROFILES] : []}
          selectedProfile={audio.inputProfile}
          onSelectProfile={audio.setInputProfile}
          error={audio.deviceError}
        />
      ) : null}
      {openMenu === "output" ? (
        <VoicePopover
          title="Dispositivo de saída"
          deviceLabel={deviceLabel(audio.outputs, audio.outputDeviceId, "Padrão do sistema")}
          volumeLabel="Volume de saída"
          volume={audio.outputVolume}
          onVolumeChange={audio.setOutputVolume}
          submenu={submenu}
          onToggleDevice={() => setSubmenu(submenu === "device" ? "" : "device")}
          extraRow={null}
          devices={audio.outputs}
          selectedDeviceId={audio.outputDeviceId}
          onSelectDevice={audio.selectOutput}
          profiles={[]}
          selectedProfile=""
          onSelectProfile={() => undefined}
          error={audio.deviceError}
        />
      ) : null}
    </div>
  );
}

function VoicePopover({
  title,
  deviceLabel,
  volumeLabel,
  volume,
  onVolumeChange,
  submenu,
  onToggleDevice,
  extraRow,
  devices,
  selectedDeviceId,
  onSelectDevice,
  profiles,
  selectedProfile,
  onSelectProfile,
  error,
}: {
  title: string;
  deviceLabel: string;
  volumeLabel: string;
  volume: number;
  onVolumeChange: (value: number) => void;
  submenu: VoiceSubmenu;
  onToggleDevice: () => void;
  extraRow: { title: string; value: string; onToggle: () => void } | null;
  devices: ChatAudioDevice[];
  selectedDeviceId: string;
  onSelectDevice: (deviceId: string) => void;
  profiles: string[];
  selectedProfile: string;
  onSelectProfile: (profile: string) => void;
  error: string;
}) {
  return (
    <div className="absolute bottom-12 left-2 right-2 z-30 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl">
      <PopoverRow
        title={title}
        value={deviceLabel}
        onClick={onToggleDevice}
      />
      {submenu === "device" ? (
        <ChoiceList
          items={devices.map((device) => ({
            id: device.id,
            label: device.label,
          }))}
          selectedId={selectedDeviceId}
          onSelect={onSelectDevice}
          error={error}
        />
      ) : null}
      {extraRow ? (
        <>
          <div className="mx-3 border-t border-zinc-100" />
          <PopoverRow
            title={extraRow.title}
            value={extraRow.value}
            onClick={extraRow.onToggle}
          />
          {profiles.length > 0 ? (
            <ChoiceList
              items={profiles.map((profile) => ({
                id: profile,
                label: profile,
              }))}
              selectedId={selectedProfile}
              onSelect={onSelectProfile}
              error=""
            />
          ) : null}
        </>
      ) : null}
      <div className="mx-3 border-t border-zinc-100" />
      <div className="px-3 py-2.5">
        <p className="mb-2 text-[13px] font-medium text-zinc-800">{volumeLabel}</p>
        <input
          type="range"
          min={0}
          max={100}
          value={volume}
          onChange={(event) => onVolumeChange(Number(event.target.value))}
          className="voice-slider h-1.5 w-full cursor-pointer appearance-none rounded-full bg-zinc-200 accent-teal-600"
          aria-label={volumeLabel}
        />
      </div>
      <div className="border-t border-zinc-100">
        <Link
          href="/configuracoes"
          className="flex items-center gap-2 px-3 py-2.5 text-[13px] text-zinc-700 hover:bg-zinc-50"
        >
          <GearIcon />
          Configurações de voz
        </Link>
      </div>
    </div>
  );
}

function PopoverRow({
  title,
  value,
  onClick,
}: {
  title: string;
  value: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-zinc-50"
    >
      <span className="min-w-0">
        <span className="block text-[13px] font-medium text-zinc-800">{title}</span>
        <span className="block truncate text-xs text-zinc-500">{value}</span>
      </span>
      <RightChevronIcon />
    </button>
  );
}

function ChoiceList({
  items,
  selectedId,
  onSelect,
  error,
}: {
  items: { id: string; label: string }[];
  selectedId: string;
  onSelect: (id: string) => void;
  error: string;
}) {
  return (
    <div className="border-t border-zinc-100 bg-zinc-50 py-1">
      {error ? <p className="px-3 py-2 text-xs text-red-600">{error}</p> : null}
      {items.length === 0 && !error ? (
        <p className="px-3 py-2 text-xs text-zinc-500">Nenhum dispositivo.</p>
      ) : (
        items.map((item) => (
          <button
            key={item.id || item.label}
            type="button"
            onClick={() => onSelect(item.id)}
            className={`block w-full truncate px-3 py-1.5 text-left text-xs ${
              item.id === selectedId
                ? "font-medium text-teal-800"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            {item.label}
          </button>
        ))
      )}
    </div>
  );
}

function ControlGroup({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center rounded-md hover:bg-zinc-300/60">{children}</div>
  );
}

function IconButton({
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
      className={`flex h-9 w-9 items-center justify-center rounded-md ${
        isOff ? "text-red-600" : "text-zinc-700"
      }`}
    >
      {children}
    </button>
  );
}

function ChevronButton({
  open,
  onClick,
}: {
  open: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title="Ajustes de voz"
      aria-label="Ajustes de voz"
      aria-expanded={open}
      onClick={onClick}
      className="flex h-9 w-4 items-center justify-center text-zinc-500"
    >
      <ChevronIcon up={open} />
    </button>
  );
}

function deviceLabel(
  devices: ChatAudioDevice[],
  selectedId: string,
  fallback: string,
) {
  return devices.find((device) => device.id === selectedId)?.label ?? fallback;
}

function statusLabel(
  isDeafened: boolean,
  isMicMuted: boolean,
  user: User,
): string {
  if (isDeafened) {
    return "Ensurdecido";
  }

  if (isMicMuted) {
    return "Mudo";
  }

  if (user.isOnline) {
    return "Online";
  }

  return user.title || "Offline";
}

function MicIcon({ muted }: { muted: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <path d="M12 18v3" />
      {muted ? <path d="m4 4 16 16" /> : null}
    </svg>
  );
}

function HeadphoneIcon({ deafened }: { deafened: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 13v3a2 2 0 0 0 2 2h1v-7H6a2 2 0 0 0-2 2Z" />
      <path d="M20 13v3a2 2 0 0 1-2 2h-1v-7h1a2 2 0 0 1 2 2Z" />
      <path d="M4 13a8 8 0 0 1 16 0" />
      {deafened ? <path d="m4 4 16 16" /> : null}
    </svg>
  );
}

function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.2a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.2a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.2a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9c.3.7.9 1.2 1.6 1.3H21a2 2 0 1 1 0 4h-.2a1.7 1.7 0 0 0-1.4 1.1Z" />
    </svg>
  );
}

function ChevronIcon({ up }: { up?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={`h-3 w-3 ${up ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function RightChevronIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 shrink-0 text-zinc-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}
