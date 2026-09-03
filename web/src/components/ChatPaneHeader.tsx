import type { ReactNode } from "react";

type ChatPaneHeaderProps = {
  title: ReactNode;
  trailing?: ReactNode;
};

/**
 * Cabeçalho do painel de chat (canal, DM ou voz).
 * Título à esquerda e ações à direita; a linha de baixo não encosta nas bordas.
 */
export function ChatPaneHeader({ title, trailing }: ChatPaneHeaderProps) {
  return (
    <header className="flex h-14 shrink-0 flex-col justify-center">
      <div className="flex min-h-0 flex-1 items-center justify-between gap-3 px-4">
        <div className="flex min-w-0 items-center gap-3 text-[15px] font-semibold leading-none text-zinc-900">
          {title}
        </div>
        {trailing}
      </div>
      <div className="mx-3.5 border-b border-zinc-200" />
    </header>
  );
}
