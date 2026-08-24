import type { ComposerPanel } from "@/shared/chatComposer";

type ChatComposerToolbarProps = {
  panel: ComposerPanel;
  isRecording: boolean;
  onOpenPanel: (panel: ComposerPanel) => void;
  onToggleRecord: () => void;
};

export function ChatComposerToolbar({
  panel,
  isRecording,
  onOpenPanel,
  onToggleRecord,
}: ChatComposerToolbarProps) {
  const isEmojiOpen = panel === "emoji";

  return (
    <div className="mb-0.5 flex shrink-0 items-center">
      <button
        type="button"
        title="Emojis"
        aria-label="Emojis"
        aria-expanded={isEmojiOpen}
        disabled={isRecording}
        onClick={() => onOpenPanel(isEmojiOpen ? "" : "emoji")}
        className={`flex h-10 w-10 items-center justify-center rounded-md ${
          isEmojiOpen
            ? "bg-zinc-200 text-zinc-800"
            : "text-zinc-500 hover:bg-zinc-200 hover:text-zinc-800"
        } disabled:opacity-40`}
      >
        <EmojiIcon />
      </button>
      <button
        type="button"
        title={isRecording ? "Parar e enviar áudio" : "Gravar áudio"}
        aria-label={isRecording ? "Parar e enviar áudio" : "Gravar áudio"}
        aria-pressed={isRecording}
        onClick={onToggleRecord}
        className={`flex h-10 w-10 items-center justify-center rounded-md ${
          isRecording
            ? "text-red-600 hover:bg-red-50"
            : "text-zinc-500 hover:bg-zinc-200 hover:text-zinc-800"
        }`}
      >
        <MicIcon />
      </button>
    </div>
  );
}

function EmojiIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="12" cy="12" r="8" />
      <path d="M9 15c.9 1 2 1.5 3 1.5s2.1-.5 3-1.5" />
      <circle cx="9.5" cy="10.5" r="0.9" fill="currentColor" />
      <circle cx="14.5" cy="10.5" r="0.9" fill="currentColor" />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M6 11a6 6 0 0 0 12 0M12 17v4" />
    </svg>
  );
}
