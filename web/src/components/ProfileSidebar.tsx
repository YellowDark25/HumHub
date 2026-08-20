import type { Space } from "@/domain/Space";
import Link from "next/link";
import { Avatar } from "./Avatar";

type ProfileSidebarProps = {
  tags: string[];
  spaces: Space[];
};

export function ProfileSidebar({ tags, spaces }: ProfileSidebarProps) {
  return (
    <aside className="flex flex-col gap-4">
      <section className="rounded-2xl border border-zinc-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-zinc-900">Tags de usuário</h2>
        {tags.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">Nenhuma tag.</p>
        ) : (
          <ul className="mt-3 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <li
                key={tag}
                className="rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs font-medium uppercase text-zinc-700"
              >
                {tag}
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="rounded-2xl border border-zinc-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-zinc-900">
          Membro destes espaços
        </h2>
        {spaces.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">Nenhum espaço.</p>
        ) : (
          <ul className="mt-3 flex flex-wrap gap-2">
            {spaces.map((space) => (
              <li key={space.id}>
                <Link
                  href={`/espacos/${space.id}`}
                  title={space.name}
                  aria-label={space.name}
                  className="block rounded-lg hover:ring-2 hover:ring-teal-200"
                >
                  <Avatar
                    name={space.name}
                    imageUrl={space.imageUrl}
                    size="sm"
                    shape="square"
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </aside>
  );
}
