import { errorMessage } from "@/application/errors";
import { NotificationFilter } from "@/components/NotificationFilter";
import { NotificationOverview } from "@/components/NotificationOverview";
import type { Notification } from "@/domain/Notification";
import { app } from "@/infrastructure/composition";
import {
  redirectIfUnauthorized,
  requirePageToken,
} from "@/infrastructure/pageSession";
import {
  readNotificationFilter,
  toNotificationListQuery,
} from "@/shared/notificationFilter";

export default async function NotificacoesPage({
  searchParams,
}: PageProps<"/notificacoes">) {
  const token = await requirePageToken();
  const filter = readNotificationFilter(await searchParams);

  let notifications: Notification[] = [];
  let loadError = "";

  try {
    notifications = await app.listNotifications(
      token,
      toNotificationListQuery(filter),
    );
  } catch (error) {
    await redirectIfUnauthorized(error);
    loadError = errorMessage(error, "Não foi possível carregar as notificações.");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <main>
        <NotificationOverview
          notifications={notifications}
          loadError={loadError}
        />
      </main>
      <aside className="order-first lg:order-0">
        <NotificationFilter filter={filter} />
      </aside>
    </div>
  );
}
