"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { PostAttachment } from "@/domain/PostAttachment";

type PostAttachmentsProps = {
  attachments: PostAttachment[];
};

/**
 * Anexos da publicação: imagem, áudio ou arquivo.
 * Imagem abre expandida na mesma tela; áudio toca no card; outro arquivo abre em nova aba.
 */
export function PostAttachments({ attachments }: PostAttachmentsProps) {
  const [openId, setOpenId] = useState<number | null>(null);
  const openImage = attachments.find(
    (attachment) => attachment.isImage && attachment.id === openId,
  );

  if (attachments.length === 0) {
    return null;
  }

  return (
    <>
      <ul className="mt-3 flex flex-col gap-2">
        {attachments.map((attachment) => (
          <li key={attachment.id}>
            <AttachmentItem
              attachment={attachment}
              onOpenImage={() => setOpenId(attachment.id)}
            />
          </li>
        ))}
      </ul>
      {openImage ? (
        <ImageLightbox
          attachment={openImage}
          onClose={() => setOpenId(null)}
        />
      ) : null}
    </>
  );
}

/**
 * Um anexo do post: botão da foto, player de áudio ou link do arquivo.
 */
function AttachmentItem({
  attachment,
  onOpenImage,
}: {
  attachment: PostAttachment;
  onOpenImage: () => void;
}) {
  if (attachment.isAudio) {
    return (
      <audio
        controls
        preload="metadata"
        src={attachment.url}
        className="h-9 max-w-full"
      >
        Seu navegador não reproduz áudio.
      </audio>
    );
  }

  if (attachment.isImage) {
    return (
      <button
        type="button"
        onClick={onOpenImage}
        className="cursor-pointer text-left"
        aria-label={`Expandir ${attachment.name}`}
      >
        <img
          src={attachment.url}
          alt={attachment.name}
          className="max-h-72 rounded-xl"
        />
      </button>
    );
  }

  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 px-3 py-2 text-sm text-teal-700 hover:bg-zinc-50"
    >
      <FileIcon />
      <span className="min-w-0 truncate">{attachment.name}</span>
    </a>
  );
}

/**
 * Foto expandida sobre a página, sem navegar.
 * Fecha com Escape, clique no fundo ou no botão Fechar.
 */
function ImageLightbox({
  attachment,
  onClose,
}: {
  attachment: PostAttachment;
  onClose: () => void;
}) {
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onCloseRef.current();
      }
    }

    document.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Fechar"
        className="absolute inset-0 bg-black/80"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={attachment.name}
        className="relative max-h-dvh max-w-[100vw]"
      >
        <img
          src={attachment.url}
          alt={attachment.name}
          className="max-h-[92dvh] max-w-[min(96rem,92vw)] rounded-xl object-contain"
        />
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="absolute top-2 right-2 inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
        >
          <CloseIcon />
        </button>
      </div>
    </div>,
    document.body,
  );
}

/**
 * Ícone de arquivo genérico ao lado do nome do anexo.
 */
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

/**
 * X do botão de fechar a foto expandida.
 */
function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
