import type { Space } from "@/domain/Space";
import Link from "next/link";
import { Avatar } from "./Avatar";
import { SpaceBannerImage } from "./SpaceBannerImage";
import { SpaceStats } from "./SpaceStats";

type SpaceCardProps = {
  space: Space;
};

export function SpaceCard({ space }: SpaceCardProps) {
  return (
    <Link
      href={`/espacos/${space.id}`}
      className="block h-full overflow-hidden rounded-2xl border border-zinc-200 bg-white hover:border-teal-200"
    >
      <div className="relative">
        <div className="h-28 w-full overflow-hidden bg-zinc-200">
          <SpaceBannerImage url={space.bannerUrl} name={space.name} />
        </div>
        <div className="absolute bottom-0 left-4 translate-y-1/2 rounded-lg ring-4 ring-white">
          <Avatar
            name={space.name}
            imageUrl={space.imageUrl}
            size="card"
            shape="square"
            fit="contain"
          />
        </div>
      </div>
      <div className="px-5 pt-12 pb-5">
        <div className="flex items-center gap-2">
          <p className="min-w-0 truncate text-base font-semibold text-zinc-900">
            {space.name}
          </p>
          <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-500">
            {space.visibility === "private" ? "Privado" : "Público"}
          </span>
        </div>
        <p className="mt-2 line-clamp-3 text-sm leading-6 text-zinc-500">
          {space.description || "Sem descrição."}
        </p>
        <div className="mt-4 border-t border-zinc-100 pt-4">
          <SpaceStats space={space} />
        </div>
      </div>
    </Link>
  );
}
