import { errorMessage, isNotFound } from "@/application/errors";
import { FeedCard } from "@/components/FeedCard";
import { LoadError } from "@/components/LoadError";
import { ProfileHeader } from "@/components/ProfileHeader";
import { ProfileSidebar } from "@/components/ProfileSidebar";
import type { Post } from "@/domain/Post";
import type { User } from "@/domain/User";
import { app } from "@/infrastructure/composition";
import {
  redirectIfUnauthorized,
  requirePageToken,
} from "@/infrastructure/pageSession";
import { notFound } from "next/navigation";

export default async function PessoaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const token = await requirePageToken();
  const userId = Number((await params).id);

  let user: User | null = null;
  let posts: Post[] = [];
  let canEdit = false;
  let loadError = "";

  try {
    const [page, current] = await Promise.all([
      app.getPersonPage(token, userId),
      app.getCurrentUser(token),
    ]);
    user = page.user;
    posts = page.posts;
    canEdit = current.id === page.user.id;
  } catch (error) {
    await redirectIfUnauthorized(error);
    if (isNotFound(error)) {
      notFound();
    }
    loadError = errorMessage(error, "Não foi possível carregar o perfil.");
  }

  if (!user) {
    return (
      <main>
        <LoadError message={loadError || "Perfil indisponível."} />
      </main>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <ProfileHeader
        user={user}
        spaceCount={0}
        canEdit={canEdit}
      />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
        <main className="flex min-w-0 flex-col gap-4">
          {loadError ? <LoadError message={loadError} /> : null}
          {posts.length === 0 && !loadError ? (
            <p className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-sm text-zinc-500">
              Nenhuma publicação neste perfil.
            </p>
          ) : (
            posts.map((post) => <FeedCard key={post.id} post={post} />)
          )}
        </main>
        <ProfileSidebar tags={user.tags} spaces={[]} />
      </div>
    </div>
  );
}
