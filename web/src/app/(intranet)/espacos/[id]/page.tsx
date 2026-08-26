import { errorMessage, isNotFound } from "@/application/errors";
import { Avatar } from "@/components/Avatar";
import { FeedCard } from "@/components/FeedCard";
import { LatestActivities } from "@/components/LatestActivities";
import { LoadError } from "@/components/LoadError";
import { PostComposer } from "@/components/PostComposer";
import { SpaceFiles } from "@/components/SpaceFiles";
import { SpaceHeader } from "@/components/SpaceHeader";
import { SpaceMenu } from "@/components/SpaceMenu";
import type { Activity } from "@/domain/Activity";
import type { Post } from "@/domain/Post";
import type { Space } from "@/domain/Space";
import type { SpaceFile } from "@/domain/SpaceFile";
import type { SpaceMember } from "@/domain/SpaceMember";
import type { SpaceMembershipSettings } from "@/domain/SpaceMembershipSettings";
import { app } from "@/infrastructure/composition";
import {
  redirectIfUnauthorized,
  requirePageToken,
} from "@/infrastructure/pageSession";
import {
  readSpaceSection,
  type SpaceSectionId,
} from "@/shared/spaceSection";
import Link from "next/link";
import { notFound } from "next/navigation";

const EMPTY_SECTION_COPY: Record<
  Exclude<SpaceSectionId, "stream" | "membros" | "arquivos">,
  string
> = {
  tarefas: "Nenhuma tarefa neste espaço.",
};

type SpacePageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SpaceFeedPage({
  params,
  searchParams,
}: SpacePageProps) {
  const { id } = await params;
  const section = readSpaceSection(await searchParams);
  const spaceId = Number(id);
  const token = await requirePageToken();

  if (!Number.isFinite(spaceId) || spaceId <= 0) {
    notFound();
  }

  let space: Space | null = null;
  let posts: Post[] = [];
  let files: SpaceFile[] = [];
  let members: SpaceMember[] = [];
  let activities: Activity[] = [];
  let canManage = false;
  let membership: SpaceMembershipSettings | null = null;
  let loadError = "";

  try {
    const page = await app.getSpacePage(token, spaceId);
    space = page.space;
    posts = page.posts;
    files = page.files;
    members = page.members;
    activities = page.activities;
    canManage = page.canManage;
    membership = page.membership;
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
    <div className="flex flex-col gap-6">
      <Link href="/espacos" className="text-sm font-medium text-teal-700">
        Todos os espaços
      </Link>
      <SpaceHeader
        space={space}
        canManage={canManage}
        membership={membership}
      />
      <div className="grid items-start gap-6 lg:grid-cols-[200px_minmax(0,1fr)_260px]">
        <SpaceMenu spaceId={space.id} section={section} />
        <main className="flex min-w-0 flex-col gap-4">
          {loadError ? <LoadError message={loadError} /> : null}
          <SpaceSection
            section={section}
            space={space}
            posts={posts}
            files={files}
            members={members}
            loadError={loadError}
          />
        </main>
        <LatestActivities activities={activities} />
      </div>
    </div>
  );
}

function SpaceSection({
  section,
  space,
  posts,
  files,
  members,
  loadError,
}: {
  section: SpaceSectionId;
  space: Space;
  posts: Post[];
  files: SpaceFile[];
  members: SpaceMember[];
  loadError: string;
}) {
  if (section === "arquivos") {
    return (
      <SpaceFiles
        spaceId={space.id}
        files={files}
        canUpload={space.isMember}
      />
    );
  }

  if (section === "membros") {
    return (
      <section className="rounded-2xl border border-zinc-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-zinc-900">Membros</h2>
        <MemberList members={members} />
      </section>
    );
  }

  if (section !== "stream") {
    return (
      <p className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-sm text-zinc-500">
        {EMPTY_SECTION_COPY[section]}
      </p>
    );
  }

  return (
    <>
      {space.isMember ? (
        <PostComposer spaceId={space.id} />
      ) : (
        <p className="rounded-2xl border border-dashed border-zinc-300 bg-white p-4 text-sm text-zinc-500">
          {spaceJoinHint(space)}
        </p>
      )}
      {posts.length === 0 && !loadError ? (
        <p className="text-sm text-zinc-500">
          Nenhuma publicação neste espaço.
        </p>
      ) : (
        posts.map((post) => <FeedCard key={post.id} post={post} />)
      )}
    </>
  );
}

function spaceJoinHint(space: Space) {
  if (space.isInvited) {
    return "Aceite o convite para entrar neste espaço e passar a segui-lo.";
  }

  if (space.visibility === "public") {
    return "Siga este espaço para entrar, acompanhar as publicações e participar.";
  }

  return "Este espaço é privado. Você precisa de um convite para participar.";
}

function MemberList({ members }: { members: SpaceMember[] }) {
  if (members.length === 0) {
    return <p className="mt-3 text-sm text-zinc-500">Sem lista de membros.</p>;
  }

  return (
    <ul className="mt-3 flex flex-col gap-2">
      {members.map((membership) => (
        <li
          key={membership.user.id}
          className="flex items-center gap-2 text-sm text-zinc-700"
        >
          <Avatar
            name={membership.user.name}
            imageUrl={membership.user.imageUrl}
            size="sm"
          />
          <span className="min-w-0 truncate">
            {membership.user.name}
            {membership.role ? (
              <span className="ml-1 text-xs text-zinc-400">
                {membership.role}
              </span>
            ) : null}
          </span>
        </li>
      ))}
    </ul>
  );
}
