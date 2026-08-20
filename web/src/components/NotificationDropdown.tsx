"use client";

import Link from "next/link";
import { Avatar } from "./Avatar";
import { useNotificationDropdown } from "./useNotificationDropdown";
import type { Notification } from "@/domain/Notification";
import { formatDate } from "@/shared/format";

const BADGE_MAX = 9;

type NotificationDropdownProps = {
  unseenCount: number;
};

export function NotificationDropdown({ unseenCount }: NotificationDropdownProps) {
  const dropdown = useNotificationDropdown(unseenCount);

  return (
    <div className="relative" ref={dropdown.rootRef}>
      <button
        type="button"
        onClick={() => void dropdown.toggle()}
        aria-expanded={dropdown.isOpen}
        aria-haspopup="dialog"
        aria-label="Notificações"
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-100"
      >
        <BellIcon />
        {dropdown.badgeCount > 0 ? (
          <span className="absolute top-0.5 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-teal-700 px-1 text-[10px] font-semibold text-white">
            {dropdown.badgeCount > BADGE_MAX ? `${BADGE_MAX}+` : dropdown.badgeCount}
          </span>
        ) : null}
      </button>
      {dropdown.isOpen ? (
        <NotificationPanel
          items={dropdown.items}
          error={dropdown.error}
          isLoading={dropdown.isLoading}
          isMarking={dropdown.isMarking}
          canMarkAll={dropdown.badgeCount > 0}
          onMarkAll={() => void dropdown.markAllAsSeen()}
          onNavigate={dropdown.close}
        />
      ) : null}
    </div>
  );
}

function NotificationPanel({
  items,
  error,
  isLoading,
  isMarking,
  canMarkAll,
  onMarkAll,
  onNavigate,
}: {
  items: Notification[];
  error: string;
  isLoading: boolean;
  isMarking: boolean;
  canMarkAll: boolean;
  onMarkAll: () => void;
  onNavigate: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-label="Notificações"
      aria-busy={isLoading}
      className="absolute right-0 z-30 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg"
    >
      <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
        <h2 className="text-sm font-semibold text-zinc-900">Notificações</h2>
        <button
          type="button"
          onClick={onMarkAll}
          disabled={isMarking || !canMarkAll}
          title="Marcar todas como lidas"
          aria-label="Marcar todas como lidas"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 disabled:opacity-40"
        >
          <CheckIcon />
        </button>
      </div>
      <NotificationList
        items={items}
        error={error}
        isLoading={isLoading}
        onNavigate={onNavigate}
      />
      <div className="border-t border-zinc-100 p-3">
        <Link
          href="/notificacoes"
          onClick={onNavigate}
          className="flex h-10 items-center justify-center rounded-lg border border-zinc-200 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          Exibir todas as notificações
        </Link>
      </div>
    </div>
  );
}

function NotificationList({
  items,
  error,
  isLoading,
  onNavigate,
}: {
  items: Notification[];
  error: string;
  isLoading: boolean;
  onNavigate: () => void;
}) {
  if (isLoading) {
    return (
      <p className="px-4 py-8 text-center text-sm text-zinc-500">Carregando…</p>
    );
  }

  if (error) {
    return <p className="px-4 py-6 text-sm text-red-600">{error}</p>;
  }

  if (items.length === 0) {
    return (
      <p className="px-4 py-8 text-center text-sm text-zinc-500">
        Nenhuma notificação.
      </p>
    );
  }

  return (
    <ul className="max-h-[min(22rem,60vh)] overflow-y-auto">
      {items.map((notification) => (
        <NotificationRow
          key={notification.id}
          notification={notification}
          onNavigate={onNavigate}
        />
      ))}
    </ul>
  );
}

function NotificationRow({
  notification,
  onNavigate,
}: {
  notification: Notification;
  onNavigate: () => void;
}) {
  return (
    <li>
      <Link
        href="/notificacoes"
        onClick={onNavigate}
        className="flex gap-3 px-4 py-3 hover:bg-zinc-50"
      >
        <Avatar name={notification.originatorName ?? "Usuário"} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-sm text-zinc-800">{notification.text}</p>
          <p className="mt-1 text-xs text-teal-700">
            {formatDate(notification.publishedAt)}
          </p>
        </div>
        {notification.isUnseen ? (
          <span
            aria-label="Não lida"
            className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-teal-500"
          />
        ) : (
          <span className="mt-2 h-2.5 w-2.5 shrink-0" />
        )}
      </Link>
    </li>
  );
}

function BellIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5" />
      <path d="M9.5 17a2.5 2.5 0 0 0 5 0" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12.5 9.5 17 19 7" />
    </svg>
  );
}
