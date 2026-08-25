import type { ReactNode } from "react";
import {
  CHAT_EMOJIS,
  CHAT_QUICK_REACTIONS,
} from "@/shared/chatComposer";

type ChatMessageToolbarProps = {
  canEdit: boolean;
  emojiOpen: boolean;
  onReact: (emoji: string) => void;
  onToggleEmoji: () => void;
  onEdit: () => void;
  onReply: () => void;
  onMore: () => void;
};

export function ChatMessageToolbar({
  canEdit,
  emojiOpen,
  onReact,
  onToggleEmoji,
  onEdit,
  onReply,
  onMore,
}: ChatMessageToolbarProps) {
  return (
    <div className="flex items-center rounded-lg border border-zinc-200 bg-white shadow-sm">
      {CHAT_QUICK_REACTIONS.map((emoji) => (
        <ToolbarButton
          key={emoji}
          label={`Reagir com ${emoji}`}
          onClick={() => onReact(emoji)}
        >
          <span className="text-base leading-none">{emoji}</span>
        </ToolbarButton>
      ))}
      <div className="relative">
        <ToolbarButton
          label="Adicionar reação"
          pressed={emojiOpen}
          onClick={onToggleEmoji}
        >
          <AddReactionIcon />
        </ToolbarButton>
        {emojiOpen ? (
          <div className="absolute top-full right-0 z-20 mt-1 w-64 rounded-xl bg-white p-2 shadow-lg ring-1 ring-zinc-200">
            <div className="grid grid-cols-8 gap-1">
              {CHAT_EMOJIS.map((emoji) => (
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
            </div>
          </div>
        ) : null}
      </div>
      {canEdit ? (
        <ToolbarButton label="Editar" onClick={onEdit}>
          <PencilIcon />
        </ToolbarButton>
      ) : null}
      <ToolbarButton label="Responder" onClick={onReply}>
        <ReplyIcon />
      </ToolbarButton>
      <ToolbarButton label="Mais" onClick={onMore}>
        <MoreIcon />
      </ToolbarButton>
    </div>
  );
}

function ToolbarButton({
  label,
  pressed,
  onClick,
  children,
}: {
  label: string;
  pressed?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={pressed}
      onClick={onClick}
      className={`flex h-8 w-8 items-center justify-center text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 ${
        pressed ? "bg-zinc-100 text-zinc-800" : ""
      }`}
    >
      {children}
    </button>
  );
}

function AddReactionIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <path d="M9 10h.01M15 10h.01" />
      <path d="M18 4v4M16 6h4" />
    </svg>
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

function MoreIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <circle cx="6" cy="12" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="18" cy="12" r="1.6" />
    </svg>
  );
}
