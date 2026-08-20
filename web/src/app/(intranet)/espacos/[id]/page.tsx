import { errorMessage, isNotFound } from "@/application/errors";
import { FeedCard } from "@/components/FeedCard";
import { LoadError } from "@/components/LoadError";
import { PostComposer } from "@/components/PostComposer";
import type { Post } from "@/domain/Post";
import type { Space } from "@/domain/Space";
import type { SpaceMember } from "@/domain/SpaceMember";
import { app } from "@/infrastructure/composition";
import {
  redirectIfUnauthorized,
  requirePageToken,
} from "@/infrastructure/pageSession";
import Link from "next/link";
import { notFound } from "next/navigation";

type SpacePageProps = {
  params: Promise<{ id: string }>;
};

export default async function SpaceFeedPage({ params }: SpacePageProps) {
  const { id } = await params;
  const spaceId = Number(id);
  const token = await requirePageToken();

  if (!Number.isFinite(spaceId) || spaceId <= 0) {
    notFound();
  }

  let space: Space | null = null;
  let posts: Post[] = [];
  let members: SpaceMember[] = [];
  let loadError = "";

  try {
    const page = await app.getSpacePage(token, spaceId);
    space = page.space;
    posts = page.posts;
    members = page.members;
  } catch (error) {
    await redirectIfUnauthorized(error);
    if (isNotFound(error)) {
      notFound();
    }
    loadError = errorMessage(error, "Não foi possível carregar o espaço.");
  }

  if (!space) {
    return (
      <main>
        <LoadError message={loadError || "Espaço indisponível."} />
      </main>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
      <main className="flex flex-col gap-4">
        <Link href="/espacos" className="text-sm font-medium text-teal-700">
          Todos os espaços
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">{space.name}</h1>
          {space.description ? (
            <p className="mt-1 text-sm text-zinc-500">{space.description}</p>
          ) : null}
        </div>
        {loadError ? <LoadError message={loadError} /> : null}
        <PostComposer spaceId={space.id} />
        {posts.length === 0 && !loadError ? (
          <p className="text-sm text-zinc-500">
            Nenhuma publicação neste espaço.
          </p>
        ) : (
          posts.map((post) => <FeedCard key={post.id} post={post} />)
        )}
      </main>
      <aside className="rounded-2xl border border-zinc-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-zinc-900">Membros</h2>
        <ul className="mt-3 flex flex-col gap-2">
          {members.length === 0 ? (
            <li className="text-sm text-zinc-500">Sem lista de membros.</li>
          ) : (
            members.map((membership) => (
              <li key={membership.user.id} className="text-sm text-zinc-700">
                {membership.user.name}
                {membership.role ? (
                  <span className="ml-1 text-xs text-zinc-400">
                    {membership.role}
                  </span>
                ) : null}
              </li>
            ))
          )}
        </ul>
      </aside>
    </div>
  );
}

