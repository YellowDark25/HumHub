"use client";

import { ChatComposerAttachments } from "./ChatComposerAttachments";
import { PostComposerActions } from "./PostComposerActions";
import { RichTextField } from "./RichTextField";
import { usePublishPost } from "./usePublishPost";

type ComposerProps = {
  spaceId: number;
};

export function PostComposer({ spaceId }: ComposerProps) {
  const composer = usePublishPost(spaceId);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void composer.publish();
      }}
      className="rounded-2xl border border-zinc-200 bg-white p-3"
    >
      <RichTextField
        value={composer.message}
        onChange={composer.setMessage}
        placeholder="Escreva no espaço…"
        disabled={composer.isSending}
      />
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
      {composer.error ? (
        <p className="mb-2 text-xs text-red-600">{composer.error}</p>
      ) : null}
      <PostComposerActions
        isSending={composer.isSending}
        canPublish={composer.canPublish}
        fileCount={composer.files.length}
        onPickFiles={composer.openFilePicker}
      />
    </form>
  );
}
