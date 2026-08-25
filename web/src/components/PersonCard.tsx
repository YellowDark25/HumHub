import type { Person } from "@/domain/Person";
import Link from "next/link";
import { Avatar } from "./Avatar";
import { OnlineStatusBadge } from "./OnlineStatusBadge";
import { PersonFriendshipActions } from "./PersonFriendshipActions";

type PersonCardProps = {
  person: Person;
};

export function PersonCard({ person }: PersonCardProps) {
  return (
    <article className="flex h-full flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4">
      <Link
        href={`/pessoas/${person.id}`}
        className="flex min-w-0 items-center gap-3"
      >
        <span className="relative shrink-0">
          <Avatar name={person.name} imageUrl={person.imageUrl} />
          <OnlineStatusBadge isOnline={person.isOnline} />
        </span>
        <span className="min-w-0">
          <span className="block truncate font-medium text-zinc-900">
            {person.name}
          </span>
          {person.title ? (
            <span className="mt-0.5 block truncate text-sm text-zinc-500">
              {person.title}
            </span>
          ) : null}
          {person.tags.length > 0 ? (
            <span className="mt-1 flex flex-wrap gap-1">
              {person.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-zinc-600 uppercase"
                >
                  {tag}
                </span>
              ))}
            </span>
          ) : null}
        </span>
      </Link>
      <PersonFriendshipActions person={person} />
    </article>
  );
}
