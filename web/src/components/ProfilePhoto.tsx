"use client";

import { Avatar } from "./Avatar";
import { OnlineStatusBadge } from "./OnlineStatusBadge";
import { useProfilePhoto } from "./useProfilePhoto";

type ProfilePhotoProps = {
  name: string;
  imageUrl: string;
  isOnline?: boolean;
  canEdit?: boolean;
};

export function ProfilePhoto({
  name,
  imageUrl,
  isOnline = false,
  canEdit = true,
}: ProfilePhotoProps) {
  const photo = useProfilePhoto(imageUrl);

  return (
    <div className="shrink-0">
      <div className="relative rounded-lg ring-4 ring-white">
        <Avatar
          name={name}
          imageUrl={photo.displayedUrl}
          size="xl"
          shape="square"
        />
        <OnlineStatusBadge isOnline={isOnline} size="md" ringClass="ring-white" />
        {canEdit ? (
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
              title="Alterar foto"
              aria-label="Alterar foto do perfil"
              className="absolute bottom-1 left-1 flex h-8 w-8 items-center justify-center rounded-md bg-teal-700 text-white shadow hover:bg-teal-800 disabled:opacity-60"
            >
              <CameraIcon />
            </button>
          </>
        ) : null}
      </div>
      {photo.error ? (
        <p className="mt-2 max-w-32 text-xs text-red-600">{photo.error}</p>
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
