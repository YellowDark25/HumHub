import { formatUnreadBadge } from "@/domain/ConversationUnread";

type ChatUnreadBadgeProps = {
  count: number;
  placement?: "server" | "row";
};

/**
 * Badge vermelho com a quantidade de mensagens não lidas.
 * No servidor fica no canto do ícone (círculo ou pílula); na linha, à direita.
 */
export function ChatUnreadBadge({
  count,
  placement = "row",
}: ChatUnreadBadgeProps) {
  if (count <= 0) {
    return null;
  }

  const label = formatUnreadBadge(count);

  return (
    <span
      aria-label={`${count} não lidas`}
      className={`flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white ${
        placement === "server"
          ? "absolute -right-1 -bottom-1 z-10 ring-2 ring-zinc-100"
          : "ml-auto shrink-0"
      }`}
    >
      {label}
    </span>
  );
}
