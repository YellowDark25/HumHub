"use client";

import { useState } from "react";
import type { Space } from "@/domain/Space";
import Link from "next/link";
import { Avatar } from "./Avatar";

type SpaceCardProps = {
  space: Space;
};

export function SpaceCard({ space }: SpaceCardProps) {
  return (
    <Link
      href={`/espacos/${space.id}`}
      className="block h-full overflow-hidden rounded-2xl border border-zinc-200 bg-white hover:border-teal-200"
    >
      <div className="relative h-28 bg-zinc-200">
        <CoverPhoto url={space.bannerUrl} name={space.name} />
        <div className="absolute bottom-0 left-4 translate-y-1/2 rounded-lg ring-4 ring-white">
          <Avatar
            name={space.name}
            imageUrl={space.imageUrl}
            size="card"
            shape="square"
          />
        </div>
      </div>
      <div className="px-5 pt-12 pb-5">
        <p className="truncate text-base font-semibold text-zinc-900">
          {space.name}
        </p>
        <p className="mt-2 line-clamp-3 text-sm leading-6 text-zinc-500">
          {space.description || "Sem descrição."}
        </p>
      </div>
    </Link>
  );
}

function CoverPhoto({ url, name }: { url: string; name: string }) {
  const [failedUrl, setFailedUrl] = useState("");
  const showImage = Boolean(url) && failedUrl !== url;

  if (!showImage) {
    return null;
  }

  return (
    <img
      src={url}
      alt={`Capa de ${name}`}
      className="h-full w-full object-cover"
      onError={() => setFailedUrl(url)}
    />
  );
}
