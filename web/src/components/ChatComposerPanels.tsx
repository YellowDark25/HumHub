import type { ReactNode } from "react";
import { CHAT_EMOJIS, type ComposerPanel } from "@/shared/chatComposer";

type ChatComposerPanelsProps = {
  panel: ComposerPanel;
  onSelectFile: () => void;
  onOpenPanel: (panel: ComposerPanel) => void;
  onInsertEmoji: (emoji: string) => void;
  onCreateTopic?: () => void;
};

export function ChatComposerPanels({
  panel,
  onSelectFile,
  onOpenPanel,
  onInsertEmoji,
  onCreateTopic,
}: ChatComposerPanelsProps) {
  if (panel === "plus") {
    return (
      <div
        role="menu"
        className="absolute bottom-full left-4 mb-2 w-60 overflow-hidden rounded-xl bg-white py-1.5 shadow-lg ring-1 ring-zinc-200"
      >
        <MenuItem
          label="Enviar um arquivo"
          icon={<UploadIcon />}
          onClick={onSelectFile}
        />
        <MenuItem
          label="Criar tópico"
          icon={<ThreadIcon />}
          onClick={() => (onCreateTopic ? onCreateTopic() : onOpenPanel("thread"))}
        />
        <MenuItem
          label="Criar enquete"
          icon={<PollIcon />}
          onClick={() => onOpenPanel("poll")}
        />
      </div>
    );
  }

  if (panel === "emoji") {
    return (
      <PickerCard title="Emojis">
        <div className="grid grid-cols-8 gap-1">
          {CHAT_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => onInsertEmoji(emoji)}
              className="flex h-8 w-8 items-center justify-center rounded-md text-lg hover:bg-zinc-100"
              aria-label={`Inserir ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </PickerCard>
    );
  }

  if (panel === "thread") {
    return (
      <PickerCard title="Criar tópico">
        <p className="text-sm text-zinc-500">
          Tópicos em conversas chegam em breve.
        </p>
      </PickerCard>
    );
  }

  if (panel === "poll") {
    return (
      <PickerCard title="Criar enquete">
        <p className="text-sm text-zinc-500">
          Enquetes no chat ainda não estão disponíveis.
        </p>
      </PickerCard>
    );
  }

  return null;
}

function PickerCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="absolute inset-x-4 bottom-full mb-2 rounded-xl bg-white p-3 shadow-lg ring-1 ring-zinc-200">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
        {title}
      </p>
      {children}
    </div>
  );
}

function MenuItem({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100"
    >
      <span className="flex h-8 w-8 items-center justify-center text-zinc-500">
        {icon}
      </span>
      {label}
    </button>
  );
}

function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" />
      <path d="M14 3v5h5" />
      <path d="M12 18v-7M9 14l3-3 3 3" />
    </svg>
  );
}

function ThreadIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M5 7h10M5 12h8M5 17h6" />
      <path d="M17 13v6M14 16h6" />
    </svg>
  );
}

function PollIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M5 18V9M10 18V6M15 18v-7M20 18V4" />
    </svg>
  );
}

