import type { User } from "@/domain/User";
import Link from "next/link";
import { ProfilePhoto } from "./ProfilePhoto";

type ProfileHeaderProps = {
  user: User;
  spaceCount: number;
};

export function ProfileHeader({ user, spaceCount }: ProfileHeaderProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
      <div className="h-24 bg-teal-700" />
      <div className="flex flex-wrap items-end justify-between gap-4 px-6 pb-5">
        <div className="-mt-10 flex min-w-0 items-end gap-4">
          <ProfilePhoto name={user.name} imageUrl={user.imageUrl} />
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
          <p className="text-center">
            <span className="block text-base font-semibold text-zinc-900">
              {spaceCount}
            </span>
            <span className="text-xs text-zinc-500">Espaços</span>
          </p>
          <Link
            href="/configuracoes"
            className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white"
          >
            Editar conta
          </Link>
        </div>
      </div>
    </section>
  );
}
