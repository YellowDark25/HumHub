import type { Activity } from "@/domain/Activity";
import { formatDate } from "@/shared/format";
import { Avatar } from "./Avatar";

const SIDEBAR_ACTIVITY_LIMIT = 8;

type LatestActivitiesProps = {
  activities: Activity[];
};

export function LatestActivities({ activities }: LatestActivitiesProps) {
  const items = activities.slice(0, SIDEBAR_ACTIVITY_LIMIT);

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-zinc-900">
        Últimas atividades
      </h2>
      <ul className="mt-3 flex flex-col gap-3">
        {items.length === 0 ? (
          <li className="text-sm text-zinc-500">Nada recente.</li>
        ) : (
          items.map((activity) => (
            <ActivityRow key={activity.id} activity={activity} />
          ))
        )}
      </ul>
    </section>
  );
}

function ActivityRow({ activity }: { activity: Activity }) {
  return (
    <li className="flex gap-2 text-sm text-zinc-600">
      <Avatar
        name={activity.originatorName}
        imageUrl={activity.originatorImageUrl}
        size="sm"
      />
      <div className="min-w-0">
        <p>{activity.text}</p>
        <p className="mt-1 text-xs text-zinc-400">
          {formatDate(activity.publishedAt)}
        </p>
      </div>
    </li>
  );
}
