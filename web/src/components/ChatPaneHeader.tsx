import type { ReactNode } from "react";

type ChatPaneHeaderProps = {
  title: ReactNode;
  trailing?: ReactNode;
};

/**
 * Cabeçalho do painel de chat (canal, DM ou voz).
 * Mostra o título à esquerda e os botões à direita — inclusive o de membros.
 */
export function ChatPaneHeader({ title, trailing }: ChatPaneHeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-zinc-200 px-4">
      <div className="flex min-w-0 items-center gap-3 text-[15px] font-semibold leading-none text-zinc-900">
        {title}
      </div>
      {trailing}
    </header>
  );
}
