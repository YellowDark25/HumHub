import type { PostAttachment } from "@/domain/PostAttachment";

type PostAttachmentsProps = {
  attachments: PostAttachment[];
};

export function PostAttachments({ attachments }: PostAttachmentsProps) {
  if (attachments.length === 0) {
    return null;
  }

  return (
    <ul className="mt-3 flex flex-col gap-2">
      {attachments.map((attachment) => (
        <li key={attachment.id}>
          {attachment.isAudio ? (
            <audio
              controls
              preload="metadata"
              src={attachment.url}
              className="h-9 max-w-full"
            >
              Seu navegador não reproduz áudio.
            </audio>
          ) : attachment.isImage ? (
            <a href={attachment.url} target="_blank" rel="noreferrer">
              <img
                src={attachment.url}
                alt={attachment.name}
                className="max-h-72 rounded-xl"
              />
            </a>
          ) : (
            <a
              href={attachment.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 px-3 py-2 text-sm text-teal-700 hover:bg-zinc-50"
            >
              <FileIcon />
              <span className="min-w-0 truncate">{attachment.name}</span>
            </a>
          )}
        </li>
      ))}
    </ul>
  );
}

function FileIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" />
      <path d="M14 3v5h5" />
    </svg>
  );
}
