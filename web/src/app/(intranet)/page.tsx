import { errorMessage } from "@/application/errors";
import { FeedCard } from "@/components/FeedCard";
import { HomeComposer } from "@/components/HomeComposer";
import { LoadError } from "@/components/LoadError";
import type { Activity } from "@/domain/Activity";
import type { Post } from "@/domain/Post";
import type { Space } from "@/domain/Space";
import { app } from "@/infrastructure/composition";
import {
  redirectIfUnauthorized,
  requirePageToken,
} from "@/infrastructure/pageSession";
import { formatDate } from "@/shared/format";
import Link from "next/link";

const SIDEBAR_ACTIVITY_LIMIT = 8;

export default async function FeedPage() {
  const token = await requirePageToken();

  let posts: Post[] = [];
  let spaces: Space[] = [];
  let activities: Activity[] = [];
  let loadError = "";

  try {
    const feed = await app.listFeed(token);
    posts = feed.posts;
    spaces = feed.spaces;
    activities = feed.activities;
  } catch (error) {
    await redirectIfUnauthorized(error);
    loadError = errorMessage(error, "Não foi possível carregar o feed.");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <main className="flex flex-col gap-4">
        {loadError ? <LoadError message={loadError} /> : null}
        <HomeComposer spaces={spaces} />
        {posts.length === 0 && !loadError ? (
          <p className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-sm text-zinc-500">
            Nenhuma publicação ainda. Escreva acima ou abra um espaço.
          </p>
        ) : (
          posts.map((post) => <FeedCard key={post.id} post={post} />)
        )}
      </main>
      <aside className="hidden flex-col gap-4 lg:flex">
        <section className="rounded-2xl border border-zinc-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-zinc-900">Espaços</h2>
          <ul className="mt-3 flex flex-col gap-1">
            {spaces.map((space) => (
              <li key={space.id}>
                <Link
                  href={`/espacos/${space.id}`}
                  className="block rounded-lg px-2 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
                >
                  {space.name}
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href="/espacos"
            className="mt-2 inline-block px-2 text-xs font-medium text-teal-700"
          >
            Ver todos
          </Link>
        </section>
        <section className="rounded-2xl border border-zinc-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-zinc-900">
            Últimas atividades
          </h2>
          <ul className="mt-3 flex flex-col gap-3">
            {activities.length === 0 ? (
              <li className="text-sm text-zinc-500">Nada recente.</li>
            ) : (
              activities.slice(0, SIDEBAR_ACTIVITY_LIMIT).map((activity) => (
                <li key={activity.id} className="text-sm text-zinc-600">
                  <p>{activity.text}</p>
                  <p className="mt-1 text-xs text-zinc-400">
                    {formatDate(activity.publishedAt)}
                  </p>
                </li>
              ))
            )}
          </ul>
        </section>
      </aside>
    </div>
  );
}
