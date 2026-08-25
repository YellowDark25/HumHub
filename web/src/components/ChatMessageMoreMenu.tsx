import type { ReactNode } from "react";
import { CHAT_MORE_REACTIONS } from "@/shared/chatComposer";

type ChatMessageMoreMenuProps = {
  canEdit: boolean;
  canDelete: boolean;
  canCreateTopic: boolean;
  onReact: (emoji: string) => void;
  onAddReaction: () => void;
  onEdit: () => void;
  onReply: () => void;
  onForward: () => void;
  onCreateTopic: () => void;
  onCopyText: () => void;
  onCopyLink: () => void;
  onSpeak: () => void;
  onDelete: () => void;
};

export function ChatMessageMoreMenu({
  canEdit,
  canDelete,
  canCreateTopic,
  onReact,
  onAddReaction,
  onEdit,
  onReply,
  onForward,
  onCreateTopic,
  onCopyText,
  onCopyLink,
  onSpeak,
  onDelete,
}: ChatMessageMoreMenuProps) {
  return (
    <div
      role="menu"
      className="absolute top-full right-0 z-20 mt-1 w-64 overflow-hidden rounded-xl bg-white py-1.5 shadow-lg ring-1 ring-zinc-200"
    >
      <div className="flex items-center gap-1 px-2 pb-1.5">
        {CHAT_MORE_REACTIONS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => onReact(emoji)}
            className="flex h-8 w-8 items-center justify-center rounded-md text-lg hover:bg-zinc-100"
            aria-label={`Reagir com ${emoji}`}
          >
            {emoji}
          </button>
        ))}
        <button
          type="button"
          onClick={onAddReaction}
          className="flex h-8 flex-1 items-center justify-center rounded-md text-xs text-zinc-500 hover:bg-zinc-100"
        >
          Adicionar reação
        </button>
      </div>
      <div className="my-1 h-px bg-zinc-100" />
      {canEdit ? (
        <MenuItem label="Editar mensagem" icon={<PencilIcon />} onClick={onEdit} />
      ) : null}
      <MenuItem label="Responder" icon={<ReplyIcon />} onClick={onReply} />
      <MenuItem label="Encaminhar" icon={<ForwardIcon />} onClick={onForward} />
      {canCreateTopic ? (
        <MenuItem label="Criar tópico" icon={<ThreadIcon />} onClick={onCreateTopic} />
      ) : null}
      <div className="my-1 h-px bg-zinc-100" />
      <MenuItem label="Copiar texto" icon={<CopyIcon />} onClick={onCopyText} />
      <MenuItem label="Copiar link da mensagem" icon={<LinkIcon />} onClick={onCopyLink} />
      <MenuItem label="Falar mensagem" icon={<SpeakIcon />} onClick={onSpeak} />
      {canDelete ? (
        <>
          <div className="my-1 h-px bg-zinc-100" />
          <MenuItem
            label="Excluir mensagem"
            icon={<TrashIcon />}
            onClick={onDelete}
            danger
          />
        </>
      ) : null}
    </div>
  );
}

function MenuItem({
  label,
  icon,
  onClick,
  danger,
}: {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-zinc-100 ${
        danger ? "text-red-600" : "text-zinc-700"
      }`}
    >
      <span className="flex h-5 w-5 items-center justify-center">{icon}</span>
      {label}
    </button>
  );
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
    </svg>
  );
}

function ReplyIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M9 17 4 12l5-5" />
      <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
    </svg>
  );
}

function ForwardIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M15 7h5v5" />
      <path d="M20 7 10 17H4v-6l6-6" />
    </svg>
  );
}

function ThreadIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M5 7h10M5 12h8M5 17h6" />
      <path d="M17 13v6M14 16h6" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1" />
      <path d="M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 1 0 7 7l1-1" />
    </svg>
  );
}

function SpeakIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M4 9v6h4l5 4V5L8 9H4Z" />
      <path d="M16 9a3 3 0 0 1 0 6" />
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
