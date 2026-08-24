type ChatTypingIndicatorProps = {
  label: string;
};

export function ChatTypingIndicator({ label }: ChatTypingIndicatorProps) {
  if (!label) {
    return null;
  }

  return (
    <p className="shrink-0 px-5 pb-1 text-xs italic text-zinc-500" aria-live="polite">
      {label}
    </p>
  );
}
