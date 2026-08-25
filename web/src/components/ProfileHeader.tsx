import type { Person } from "@/domain/Person";
import type { User } from "@/domain/User";
import Link from "next/link";
import { PersonFriendshipActions } from "./PersonFriendshipActions";
import { ProfilePhoto } from "./ProfilePhoto";

type ProfileHeaderProps = {
  user: User | Person;
  spaceCount: number;
  friendCount: number;
  canEdit?: boolean;
};

export function ProfileHeader({
  user,
  spaceCount,
  friendCount,
  canEdit = true,
}: ProfileHeaderProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
      <div className="h-24 bg-oxford" />
      <div className="flex flex-wrap items-end justify-between gap-4 px-6 pb-5">
        <div className="-mt-10 flex min-w-0 items-end gap-4">
          <ProfilePhoto
            name={user.name}
            imageUrl={user.imageUrl}
            isOnline={user.isOnline}
            canEdit={canEdit}
          />
          <div className="min-w-0 pb-1">
            <h1 className="truncate text-lg font-semibold text-zinc-900">
              {user.name}
            </h1>
            {user.title ? (
              <p className="text-sm text-zinc-500">{user.title}</p>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-6 pb-1">
          <ProfileStat value={spaceCount} label="Espaços" />
          <ProfileStat value={friendCount} label="Amigos" />
          {canEdit ? (
            <Link
              href="/configuracoes"
              className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white"
            >
              Editar conta
            </Link>
          ) : isPerson(user) ? (
            <PersonFriendshipActions person={user} />
          ) : null}
        </div>
      </div>
    </section>
  );
}

function ProfileStat({ value, label }: { value: number; label: string }) {
  return (
    <p className="text-center">
      <span className="block text-base font-semibold text-zinc-900">{value}</span>
      <span className="text-xs text-zinc-500">{label}</span>
    </p>
  );
}

function isPerson(user: User | Person): user is Person {
  return "friendship" in user && "isSelf" in user;
}
