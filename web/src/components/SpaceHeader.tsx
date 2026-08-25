"use client";

import type { Space } from "@/domain/Space";
import type { SpaceMembershipSettings } from "@/domain/SpaceMembershipSettings";
import { Avatar } from "./Avatar";
import { SpaceAcceptInviteButton } from "./SpaceAcceptInviteButton";
import { SpaceBannerImage } from "./SpaceBannerImage";
import { SpaceFollowButton } from "./SpaceFollowButton";
import { SpaceInviteButton } from "./SpaceInviteButton";
import { SpaceSettingsMenu } from "./SpaceSettingsMenu";
import { SpaceStats } from "./SpaceStats";
import { useSpaceMedia } from "./useSpaceMedia";

type SpaceHeaderProps = {
  space: Space;
  canManage: boolean;
  membership: SpaceMembershipSettings | null;
};

export function SpaceHeader({
  space,
  canManage,
  membership,
}: SpaceHeaderProps) {
  const banner = useSpaceMedia(space.id, "banner", space.bannerUrl);
  const photo = useSpaceMedia(space.id, "image", space.imageUrl);

  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
      <SpaceCover banner={banner} canManage={canManage} name={space.name} />
      <div className="flex flex-wrap items-end justify-between gap-4 px-6 pb-5">
        <div className="-mt-10 flex min-w-0 items-end gap-4">
          <SpacePhoto photo={photo} canManage={canManage} name={space.name} />
          <div className="min-w-0 pb-1">
            <div className="flex min-w-0 items-center gap-2">
              <h1 className="truncate text-lg font-semibold text-zinc-900">
                {space.name}
              </h1>
              <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-500">
                {space.visibility === "private" ? "Privado" : "Público"}
              </span>
            </div>
            {space.description ? (
              <p className="text-sm text-zinc-500">{space.description}</p>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-6 pb-1">
          <SpaceStats space={space} />
          <div className="flex items-center gap-2">
            {canManage ? <SpaceInviteButton spaceId={space.id} /> : null}
            <SpaceMembershipActions space={space} membership={membership} />
          </div>
        </div>
      </div>
      {banner.error || photo.error ? (
        <p className="px-6 pb-4 text-xs text-red-600">
          {banner.error || photo.error}
        </p>
      ) : null}
    </section>
  );
}

function SpaceMembershipActions({
  space,
  membership,
}: {
  space: Space;
  membership: SpaceMembershipSettings | null;
}) {
  if (membership) {
    return (
      <SpaceSettingsMenu
        key={space.id}
        spaceId={space.id}
        spaceName={space.name}
        membership={membership}
      />
    );
  }

  if (space.isInvited) {
    return <SpaceAcceptInviteButton spaceId={space.id} />;
  }

  if (space.visibility === "public") {
    return <SpaceFollowButton spaceId={space.id} />;
  }

  return null;
}

function SpaceCover({
  banner,
  canManage,
  name,
}: {
  banner: ReturnType<typeof useSpaceMedia>;
  canManage: boolean;
  name: string;
}) {
  return (
    <div className="relative h-48 w-full overflow-hidden bg-oxford">
      {banner.displayedUrl ? (
        <SpaceBannerImage url={banner.displayedUrl} name={name} />
      ) : null}
      {canManage ? (
        <>
          <input
            ref={banner.fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            className="sr-only"
            onChange={(event) => {
              void banner.onFileSelected(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={banner.openFilePicker}
            disabled={banner.isSaving}
            title="Alterar foto de capa"
            aria-label="Alterar foto de capa"
            className="absolute right-3 bottom-3 flex items-center gap-2 rounded-md bg-black/55 px-3 py-1.5 text-xs font-semibold text-white hover:bg-black/70 disabled:opacity-60"
          >
            <CameraIcon />
            Alterar capa
          </button>
        </>
      ) : null}
    </div>
  );
}

function SpacePhoto({
  photo,
  canManage,
  name,
}: {
  photo: ReturnType<typeof useSpaceMedia>;
  canManage: boolean;
  name: string;
}) {
  return (
    <div className="relative shrink-0 rounded-lg ring-4 ring-white">
      <Avatar
        name={name}
        imageUrl={photo.displayedUrl}
        size="xl"
        shape="square"
      />
      {canManage ? (
        <>
          <input
            ref={photo.fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            className="sr-only"
            onChange={(event) => {
              void photo.onFileSelected(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={photo.openFilePicker}
            disabled={photo.isSaving}
            title="Alterar foto do espaço"
            aria-label="Alterar foto do espaço"
            className="absolute right-1 bottom-1 flex h-8 w-8 items-center justify-center rounded-md bg-teal-700 text-white shadow hover:bg-teal-800 disabled:opacity-60"
          >
            <CameraIcon />
          </button>
        </>
      ) : null}
    </div>
  );
}

function CameraIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 8h3l2-3h6l2 3h3v11H4Z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  );
}
