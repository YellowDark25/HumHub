"use client";

import { useEffect, useState } from "react";
import {
  fileExtensionLabel,
  formatFileSize,
  isAudioFile,
  isImageFile,
} from "@/shared/chatComposer";

type ChatComposerAttachmentsProps = {
  files: File[];
  onRemove: (index: number) => void;
};

export function ChatComposerAttachments({
  files,
  onRemove,
}: ChatComposerAttachmentsProps) {
  if (files.length === 0) {
    return null;
  }

  return (
    <ul className="flex gap-3 overflow-x-auto px-3 pt-3">
      {files.map((file, index) => (
        <AttachmentCard
          key={`${file.name}-${file.size}-${file.lastModified}-${index}`}
          file={file}
          onRemove={() => onRemove(index)}
        />
      ))}
    </ul>
  );
}

function AttachmentCard({
  file,
  onRemove,
}: {
  file: File;
  onRemove: () => void;
}) {
  const previewUrl = useObjectUrl(file);
  const isImage = isImageFile(file);

  return (
    <li className="group relative w-36 shrink-0">
      <div className="relative overflow-hidden rounded-lg bg-white ring-1 ring-zinc-200">
        <div className="flex h-28 items-center justify-center bg-zinc-50">
          {isImage && previewUrl ? (
            <img
              src={previewUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <FileKindMark file={file} />
          )}
        </div>
        <div className="absolute top-1.5 right-1.5 hidden items-center gap-0.5 rounded-md bg-zinc-800/90 p-0.5 group-hover:flex">
          {previewUrl ? (
            <a
              href={previewUrl}
              target="_blank"
              rel="noreferrer"
              title="Visualizar"
              aria-label={`Visualizar ${file.name}`}
              className="flex h-7 w-7 items-center justify-center text-zinc-200 hover:text-white"
            >
              <EyeIcon />
            </a>
          ) : null}
          <button
            type="button"
            title="Remover anexo"
            aria-label={`Remover ${file.name}`}
            onClick={onRemove}
            className="flex h-7 w-7 items-center justify-center text-red-400 hover:text-red-300"
          >
            <TrashIcon />
          </button>
        </div>
      </div>
      <p className="mt-1 truncate text-xs font-medium text-zinc-700" title={file.name}>
        {file.name}
      </p>
      <p className="text-[11px] text-zinc-400">{formatFileSize(file.size)}</p>
    </li>
  );
}

function FileKindMark({ file }: { file: File }) {
  return (
    <div className="flex flex-col items-center gap-1 text-zinc-500">
      {isAudioFile(file) ? <AudioIcon /> : <FileIcon />}
      <span className="text-[10px] font-semibold tracking-wide">
        {fileExtensionLabel(file.name)}
      </span>
    </div>
  );
}

function useObjectUrl(file: File): string {
  const [url, setUrl] = useState("");

  useEffect(() => {
    const next = URL.createObjectURL(file);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [file]);

  return url;
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M4 7h16M9 7V5h6v2M8 7l1 12h6l1-12" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" />
      <path d="M14 3v5h5" />
    </svg>
  );
}

function AudioIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M9 18V6l10-2v12" />
      <circle cx="7" cy="18" r="2" />
      <circle cx="17" cy="16" r="2" />
    </svg>
  );
}
