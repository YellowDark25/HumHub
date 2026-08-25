import type { ReactNode } from "react";
import { CHAT_EMOJIS } from "@/shared/chatComposer";
import type {
  RichTextActive,
  RichTextFormat,
  RichTextPanel,
} from "./useRichTextEditor";

type RichTextToolbarProps = {
  panel: RichTextPanel;
  active: RichTextActive;
  linkUrl: string;
  linkError: string;
  disabled?: boolean;
  onTogglePanel: (panel: Exclude<RichTextPanel, "">) => void;
  onFormat: (format: RichTextFormat) => void;
  onHeading: (level: 0 | 1 | 2 | 3) => void;
  onTogglePrefix: (prefix: string) => void;
  onInsert: (text: string) => void;
  onLinkUrlChange: (value: string) => void;
  onApplyLink: () => void;
};

const TOOL_CLASS =
  "inline-flex h-8 min-w-8 cursor-pointer items-center justify-center rounded-md px-1.5 disabled:cursor-not-allowed disabled:opacity-40";
const TOOL_IDLE_CLASS = "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800";
const TOOL_ACTIVE_CLASS = "bg-teal-100 text-teal-800";

export function RichTextToolbar({
  panel,
  active,
  linkUrl,
  linkError,
  disabled,
  onTogglePanel,
  onFormat,
  onHeading,
  onTogglePrefix,
  onInsert,
  onLinkUrlChange,
  onApplyLink,
}: RichTextToolbarProps) {
  return (
    <div className="relative flex flex-wrap items-center gap-0.5">
      <ToolButton
        label="Título"
        pressed={panel === "heading"}
        disabled={disabled}
        onClick={() => onTogglePanel("heading")}
      >
        <span className="px-0.5 text-sm font-semibold">Aa</span>
        <ChevronIcon />
      </ToolButton>
      <ToolButton
        label="Negrito"
        pressed={active.bold}
        disabled={disabled}
        onClick={() => onFormat("bold")}
      >
        <span className="text-sm font-bold">B</span>
      </ToolButton>
      <ToolButton
        label="Itálico"
        pressed={active.italic}
        disabled={disabled}
        onClick={() => onFormat("italic")}
      >
        <span className="text-sm italic">I</span>
      </ToolButton>
      <ToolButton
        label="Riscado"
        pressed={active.strike}
        disabled={disabled}
        onClick={() => onFormat("strike")}
      >
        <span className="text-sm line-through">S</span>
      </ToolButton>
      <ToolButton
        label="Código"
        pressed={active.code}
        disabled={disabled}
        onClick={() => onFormat("code")}
      >
        <CodeIcon />
      </ToolButton>
      <ToolButton
        label="Link"
        pressed={panel === "link" || active.link}
        disabled={disabled}
        onClick={() => onTogglePanel("link")}
      >
        <LinkIcon />
      </ToolButton>
      <ToolButton
        label="Emoji"
        pressed={panel === "emoji"}
        disabled={disabled}
        onClick={() => onTogglePanel("emoji")}
      >
        <EmojiIcon />
      </ToolButton>
      <ToolButton
        label="Mais opções"
        pressed={panel === "more"}
        disabled={disabled}
        onClick={() => onTogglePanel("more")}
      >
        <MoreIcon />
      </ToolButton>

      {panel === "heading" ? (
        <MenuCard>
          <MenuItem label="Texto normal" onClick={() => onHeading(0)} />
          <MenuItem label="Título 1" onClick={() => onHeading(1)} />
          <MenuItem label="Título 2" onClick={() => onHeading(2)} />
          <MenuItem label="Título 3" onClick={() => onHeading(3)} />
        </MenuCard>
      ) : null}

      {panel === "more" ? (
        <MenuCard>
          <MenuItem
            label="Citação"
            onClick={() => onTogglePrefix("> ")}
          />
          <MenuItem
            label="Lista"
            onClick={() => onTogglePrefix("- ")}
          />
          <MenuItem
            label="Lista numerada"
            onClick={() => onTogglePrefix("1. ")}
          />
        </MenuCard>
      ) : null}

      {panel === "emoji" ? (
        <MenuCard className="w-64 p-2">
          <div className="grid grid-cols-8 gap-1">
            {CHAT_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => onInsert(emoji)}
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-lg hover:bg-zinc-100"
                aria-label={`Inserir ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </MenuCard>
      ) : null}

      {panel === "link" ? (
        <MenuCard className="w-72 p-3">
          <label className="block text-xs font-medium text-zinc-600">
            Endereço do link
            <input
              value={linkUrl}
              onChange={(event) => onLinkUrlChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  onApplyLink();
                }
              }}
              placeholder="https://"
              className="mt-1 h-9 w-full rounded-lg border border-zinc-200 px-2 text-sm text-zinc-800 outline-none focus:border-teal-600"
            />
          </label>
          {linkError ? (
            <p className="mt-1 text-xs text-red-600">{linkError}</p>
          ) : null}
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={onApplyLink}
            className="mt-2 h-8 cursor-pointer rounded-lg bg-teal-700 px-3 text-xs font-semibold text-white"
          >
            Inserir link
          </button>
        </MenuCard>
      ) : null}
    </div>
  );
}

function ToolButton({
  label,
  pressed,
  disabled,
  onClick,
  children,
}: {
  label: string;
  pressed?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={pressed}
      disabled={disabled}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={`${TOOL_CLASS} ${pressed ? TOOL_ACTIVE_CLASS : TOOL_IDLE_CLASS}`}
    >
      {children}
    </button>
  );
}

function MenuCard({
  children,
  className = "min-w-44 py-1",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`absolute top-full left-0 z-20 mt-1 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg ${className}`}>
      {children}
    </div>
  );
}

function MenuItem({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className="flex w-full cursor-pointer px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50"
    >
      {label}
    </button>
  );
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M3 4.5 6 7.5 9 4.5" />
    </svg>
  );
}

function CodeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="m8 8-4 4 4 4M16 8l4 4-4 4" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1" />
      <path d="M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7.1 7.1l1.1-1.1" />
    </svg>
  );
}

function EmojiIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="12" cy="12" r="8" />
      <path d="M9 15c.9 1 2 1.5 3 1.5s2.1-.5 3-1.5" />
      <circle cx="9.5" cy="10.5" r="0.8" fill="currentColor" />
      <circle cx="14.5" cy="10.5" r="0.8" fill="currentColor" />
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="m8 8 4 4 4-4M8 14l4 4 4-4" />
    </svg>
  );
}
