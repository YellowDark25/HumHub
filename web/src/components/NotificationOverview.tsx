import Link from "next/link";
import { Avatar } from "./Avatar";
import type { Notification } from "@/domain/Notification";
import { formatRelativeDate } from "@/shared/format";

type NotificationOverviewProps = {
  notifications: Notification[];
  loadError: string;
};

export function NotificationOverview({
  notifications,
  loadError,
}: NotificationOverviewProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
      <header className="border-b border-zinc-200 px-5 py-4">
        <h1 className="text-base text-zinc-500">
          Visão geral de{" "}
          <span className="font-semibold text-zinc-900">Notificação</span>
        </h1>
      </header>
      <OverviewBody notifications={notifications} loadError={loadError} />
    </section>
  );
}

function OverviewBody({
  notifications,
  loadError,
}: NotificationOverviewProps) {
  if (loadError) {
    return <p className="px-5 py-6 text-sm text-red-600">{loadError}</p>;
  }

  if (notifications.length === 0) {
    return (
      <p className="px-5 py-8 text-sm text-zinc-500">Nenhuma notificação.</p>
    );
  }

  return (
    <ul>
      {notifications.map((notification) => (
        <NotificationRow key={notification.id} notification={notification} />
      ))}
    </ul>
  );
}

function NotificationRow({ notification }: { notification: Notification }) {
  return (
    <li className="border-b border-zinc-100 last:border-b-0">
      <Link
        href={notification.href}
        className="flex gap-3 px-5 py-4 hover:bg-zinc-50"
      >
        <Avatar
          name={notification.originatorName ?? "Usuário"}
          imageUrl={notification.originatorImageUrl}
          size="sm"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm text-zinc-800">{notification.text}</p>
          <p className="mt-1 text-xs text-zinc-400">
            {formatRelativeDate(notification.publishedAt)}
          </p>
        </div>
        {notification.isUnseen ? (
          <span
            aria-label="Não lida"
            className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-teal-500"
          />
        ) : null}
      </Link>
    </li>
  );
}
