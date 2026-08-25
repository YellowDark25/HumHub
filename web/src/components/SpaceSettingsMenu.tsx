"use client";

import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import type { SpaceMembershipSettings } from "@/domain/SpaceMembershipSettings";
import { ConfirmDialog } from "./ConfirmDialog";
import {
  SPACE_SETTINGS_MENU_WIDTH,
  useSpaceSettings,
} from "./useSpaceSettings";

type SpaceSettingsMenuProps = {
  spaceId: number;
  spaceName: string;
  membership: SpaceMembershipSettings;
};

const ITEM_CLASS =
  "flex w-full cursor-pointer items-center gap-3 px-3 py-2.5 text-left text-sm text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60";

export function SpaceSettingsMenu({
  spaceId,
  spaceName,
  membership,
}: SpaceSettingsMenuProps) {
  const menu = useSpaceSettings(spaceId, membership);

  return (
    <>
      <button
        ref={menu.buttonRef}
        type="button"
        onClick={menu.toggle}
        disabled={menu.isSaving || menu.isLeaving}
        aria-expanded={menu.isOpen}
        aria-haspopup="menu"
        aria-label="Configurações do espaço"
        title="Configurações do espaço"
        className="inline-flex h-10 items-center gap-1 rounded-xl border border-zinc-200 bg-white px-3 text-zinc-600 hover:bg-zinc-50 disabled:opacity-60"
      >
        <GearIcon />
        <ChevronIcon />
      </button>
      {menu.isOpen
        ? createPortal(
            <div
              ref={menu.menuRef}
              role="menu"
              aria-label="Configurações do espaço"
              style={{
                top: menu.position.top,
                left: menu.position.left,
                width: SPACE_SETTINGS_MENU_WIDTH,
              }}
              className="fixed z-50 overflow-hidden rounded-xl border border-zinc-200 bg-white py-1 shadow-lg"
            >
              <MenuButton
                icon={<BellIcon />}
                disabled={menu.isSaving}
                onClick={() => void menu.toggleNotifications()}
              >
                {menu.settings.receivesNotifications
                  ? "Não receber notificações para novos conteúdos"
                  : "Receber notificações para novos conteúdos"}
              </MenuButton>
              {menu.settings.canLeave ? (
                <MenuButton
                  icon={<LeaveIcon />}
                  disabled={menu.isLeaving}
                  onClick={menu.askLeave}
                >
                  Deixar de participar
                </MenuButton>
              ) : null}
              <MenuButton
                icon={
                  menu.settings.showsOnDashboard ? <EyeOffIcon /> : <EyeIcon />
                }
                disabled={menu.isSaving}
                title={
                  menu.settings.showsOnDashboard
                    ? "Esta opção ocultará novos conteúdos deste espaço em seu painel"
                    : "Esta opção mostrará novos conteúdos deste espaço em seu painel"
                }
                onClick={() => void menu.toggleDashboard()}
              >
                {menu.settings.showsOnDashboard
                  ? "Ocultar publicações no painel"
                  : "Mostrar publicações no painel"}
              </MenuButton>
              {menu.error ? (
                <p className="px-3 py-2 text-xs text-red-600">{menu.error}</p>
              ) : null}
            </div>,
            document.body,
          )
        : null}
      <ConfirmDialog
        open={menu.confirmLeave}
        title="Deixar de participar"
        description={`Você sairá de ${spaceName} e deixará de ver as publicações deste espaço.`}
        confirmLabel="Sair do espaço"
        tone="danger"
        pending={menu.isLeaving}
        onConfirm={() => void menu.leave()}
        onCancel={menu.cancelLeave}
      />
    </>
  );
}

function MenuButton({
  icon,
  children,
  disabled,
  title,
  onClick,
}: {
  icon: ReactNode;
  children: ReactNode;
  disabled: boolean;
  title?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      title={title}
      onClick={onClick}
      className={ITEM_CLASS}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}

function GearIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.2a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.2a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.2a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9c.3.7.9 1.2 1.6 1.3H21a2 2 0 1 1 0 4h-.2a1.7 1.7 0 0 0-1.4 1.1Z" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-4 w-4 shrink-0 text-zinc-500"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 9a6 6 0 1 1 12 0c0 7 2 7 2 7H4s2 0 2-7Z" />
      <path d="M10 18a2 2 0 0 0 4 0" />
    </svg>
  );
}

function LeaveIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-4 w-4 shrink-0 text-zinc-500"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-4 w-4 shrink-0 text-zinc-500"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 3l18 18" />
      <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
      <path d="M9.9 5.1A10 10 0 0 1 12 5c6 0 10 7 10 7a17 17 0 0 1-3.2 4.1" />
      <path d="M6.1 6.1A17 17 0 0 0 2 12s4 7 10 7a10 10 0 0 0 4.2-.9" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-4 w-4 shrink-0 text-zinc-500"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
