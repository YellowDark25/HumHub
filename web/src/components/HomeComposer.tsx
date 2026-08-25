"use client";

import { useState } from "react";
import type { Space } from "@/domain/Space";
import { ChatComposerAttachments } from "./ChatComposerAttachments";
import { PostComposerActions } from "./PostComposerActions";
import { RichTextField } from "./RichTextField";
import { usePublishPost } from "./usePublishPost";

type HomeComposerProps = {
  spaces: Space[];
};

export function HomeComposer({ spaces }: HomeComposerProps) {
  const [spaceId, setSpaceId] = useState(spaces[0]?.id ?? 0);
  const composer = usePublishPost(spaceId);

  if (spaces.length === 0) {
    return null;
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void composer.publish();
      }}
      className="rounded-2xl border border-zinc-200 bg-white p-4"
    >
      <p className="text-sm font-semibold text-zinc-900">Nova publicação</p>
      <div className="mt-2">
        <RichTextField
          value={composer.message}
          onChange={composer.setMessage}
          placeholder="O que está acontecendo?"
          disabled={composer.isSending}
        />
      </div>
      <ChatComposerAttachments
        files={composer.files}
        onRemove={composer.removeFile}
      />
      <input
        ref={composer.fileInputRef}
        type="file"
        multiple
        hidden
        accept={composer.fileAccept}
        onChange={(event) => composer.addFiles(event.target.files)}
      />
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <select
          value={spaceId}
          onChange={(event) => setSpaceId(Number(event.target.value))}
          className="h-9 rounded-lg border border-zinc-200 bg-white px-2 text-sm text-zinc-700"
        >
          {spaces.map((space) => (
            <option key={space.id} value={space.id}>
              {space.name}
            </option>
          ))}
        </select>
        <PostComposerActions
          isSending={composer.isSending}
          canPublish={composer.canPublish}
          fileCount={composer.files.length}
          onPickFiles={composer.openFilePicker}
        />
      </div>
      {composer.error ? (
        <p className="mt-2 text-xs text-red-600">{composer.error}</p>
      ) : null}
    </form>
  );
}
