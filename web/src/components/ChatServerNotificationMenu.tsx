"use client";

import type { ChatNotificationPreference } from "@/domain/ChatNotificationPreference";
import {
  CHAT_MUTE_DURATION_OPTIONS,
  CHAT_NOTIFICATION_LEVEL_OPTIONS,
} from "@/shared/chatNotification";
import { useChatServerNotifications } from "./useChatServerNotifications";

type ChatServerNotificationMenuProps = {
  initialPreference: ChatNotificationPreference;
};

export function ChatServerNotificationMenu({
  initialPreference,
}: ChatServerNotificationMenuProps) {
  const menu = useChatServerNotifications(initialPreference);
  const isQuiet = menu.preference.isMuted || menu.preference.level === "nothing";

  return (
    <div className="relative" ref={menu.rootRef}>
      <button
        type="button"
        onClick={menu.toggle}
        disabled={menu.isSaving}
        aria-expanded={menu.isOpen}
        aria-haspopup="menu"
        aria-label="Preferências de notificação do servidor"
        title="Notificações do servidor"
        className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-200 hover:text-zinc-800"
      >
        {isQuiet ? <BellOffIcon /> : <BellIcon />}
      </button>
      {menu.isOpen ? (
        <div
          role="menu"
          className="absolute top-full right-0 z-30 mt-1 w-72 rounded-xl border border-zinc-200 bg-white py-1.5 shadow-lg"
        >
          {menu.preference.isMuted ? (
            <MenuButton
              label="Reativar notificações"
              disabled={menu.isSaving}
              onClick={menu.unmute}
            />
          ) : (
            <div
              className="relative"
              onMouseEnter={menu.openMute}
              onMouseLeave={menu.closeMute}
            >
              <MenuButton
                label="Silenciar servidor"
                disabled={menu.isSaving}
                hasSubmenu
                onClick={menu.openMute}
              />
              {menu.isMuteOpen ? (
                <div
                  role="menu"
                  className="absolute top-0 right-full z-40 mr-1 w-56 rounded-xl border border-zinc-200 bg-white py-1.5 shadow-lg"
                >
                  {CHAT_MUTE_DURATION_OPTIONS.map((option) => (
                    <MenuButton
                      key={option.id}
                      label={option.label}
                      disabled={menu.isSaving}
                      onClick={() => menu.muteFor(option.id)}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          )}
          <div className="my-1.5 border-t border-zinc-200" />
          {CHAT_NOTIFICATION_LEVEL_OPTIONS.map((option) => (
            <MenuButton
              key={option.id}
              label={option.label}
              disabled={menu.isSaving}
              selected={menu.preference.level === option.id}
              onClick={() => menu.saveLevel(option.id)}
            />
          ))}
          {menu.error ? (
            <p className="px-3 py-2 text-xs text-red-600">{menu.error}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function MenuButton({
  label,
  disabled,
  selected,
  hasSubmenu,
  onClick,
}: {
  label: string;
  disabled: boolean;
  selected?: boolean;
  hasSubmenu?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={onClick}
      className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-[13px] text-zinc-800 hover:bg-zinc-100 disabled:opacity-60"
    >
      <span>{label}</span>
      {hasSubmenu ? <span className="text-zinc-400">›</span> : null}
      {selected ? <RadioOn /> : selected === false ? <RadioOff /> : null}
    </button>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M6 9a6 6 0 1 1 12 0c0 7 2 7 2 7H4s2 0 2-7Z" />
      <path d="M10 18a2 2 0 0 0 4 0" />
    </svg>
  );
}

function BellOffIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M6 9a6 6 0 0 1 10.5-3.9" />
      <path d="M18 13.5V9c0-.7-.1-1.3-.4-1.9" />
      <path d="M20 16H6.5" />
      <path d="M10 18a2 2 0 0 0 4 0" />
      <path d="m4 4 16 16" />
    </svg>
  );
}

function RadioOn() {
  return (
    <span className="flex h-4 w-4 items-center justify-center rounded-full border border-teal-700">
      <span className="h-2 w-2 rounded-full bg-teal-700" />
    </span>
  );
}

function RadioOff() {
  return <span className="h-4 w-4 rounded-full border border-zinc-300" />;
}
