import { errorMessage } from "@/application/errors";
import { FeedCard } from "@/components/FeedCard";
import { HomeComposer } from "@/components/HomeComposer";
import { LoadError } from "@/components/LoadError";
import { ProfileHeader } from "@/components/ProfileHeader";
import { ProfileMenu } from "@/components/ProfileMenu";
import { ProfileSidebar } from "@/components/ProfileSidebar";
import type { Post } from "@/domain/Post";
import type { Space } from "@/domain/Space";
import type { User } from "@/domain/User";
import { app } from "@/infrastructure/composition";
import {
  redirectIfUnauthorized,
  requirePageToken,
} from "@/infrastructure/pageSession";
import {
  readProfileSection,
  type ProfileSectionId,
} from "@/shared/profileSection";

const EMPTY_SECTION_COPY: Record<
  Exclude<ProfileSectionId, "stream" | "sobre">,
  string
> = {
  arquivos: "Nenhum arquivo neste perfil.",
  tarefas: "Nenhuma tarefa neste perfil.",
  wiki: "Nenhuma página wiki neste perfil.",
};

export default async function PerfilPage({
  searchParams,
}: PageProps<"/perfil">) {
  const token = await requirePageToken();
  const section = readProfileSection(await searchParams);

  let user: User | null = null;
  let posts: Post[] = [];
  let spaces: Space[] = [];
  let loadError = "";

  try {
    const page = await app.getProfilePage(token);
    user = page.user;
    posts = page.posts;
    spaces = page.spaces;
  } catch (error) {
    await redirectIfUnauthorized(error);
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
      <ProfileHeader user={user} spaceCount={spaces.length} />
      <div className="grid gap-6 lg:grid-cols-[200px_minmax(0,1fr)_260px]">
        <ProfileMenu section={section} />
        <main className="flex min-w-0 flex-col gap-4">
          {loadError ? <LoadError message={loadError} /> : null}
          <ProfileSection
            section={section}
            user={user}
            posts={posts}
            spaces={spaces}
            loadError={loadError}
          />
        </main>
        <ProfileSidebar tags={user.tags} spaces={spaces} />
      </div>
    </div>
  );
}

function ProfileSection({
  section,
  user,
  posts,
  spaces,
  loadError,
}: {
  section: ProfileSectionId;
  user: User;
  posts: Post[];
  spaces: Space[];
  loadError: string;
}) {
  if (section === "sobre") {
    return <AboutSection user={user} />;
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
      <HomeComposer spaces={spaces} />
      {posts.length === 0 && !loadError ? (
        <p className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-sm text-zinc-500">
          Você ainda não publicou nada.
        </p>
      ) : (
        posts.map((post) => <FeedCard key={post.id} post={post} />)
      )}
    </>
  );
}

function AboutSection({ user }: { user: User }) {
  const fields = [
    { label: "Nome", value: user.name },
    { label: "Cargo", value: user.title },
    { label: "Usuário", value: user.username },
    { label: "E-mail", value: user.email },
  ];

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6">
      <h2 className="text-sm font-semibold text-zinc-900">Sobre</h2>
      {user.about ? (
        <p className="mt-3 text-sm leading-6 text-zinc-600">{user.about}</p>
      ) : (
        <p className="mt-3 text-sm text-zinc-400">Nenhuma descrição ainda.</p>
      )}
      <dl className="mt-4 divide-y divide-zinc-100 border-t border-zinc-100">
        {fields.map((field) => (
          <div key={field.label} className="flex gap-4 py-3">
            <dt className="w-24 shrink-0 text-sm text-zinc-500">{field.label}</dt>
            <dd className="min-w-0 text-sm text-zinc-900">
              {field.value || "—"}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
