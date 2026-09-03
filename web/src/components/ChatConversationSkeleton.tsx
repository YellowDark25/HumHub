const MESSAGE_ROWS = [
  { align: "start", width: "w-[42%]" },
  { align: "end", width: "w-[36%]" },
  { align: "start", width: "w-[55%]" },
  { align: "end", width: "w-[28%]" },
  { align: "start", width: "w-[38%]" },
  { align: "end", width: "w-[48%]" },
] as const;

/**
 * Placeholder com shimmer enquanto a conversa carrega.
 * Espelha o painel (cabeçalho, bolhas e compositor) sem texto de loading.
 */
export function ChatConversationSkeleton() {
  return (
    <section
      aria-busy="true"
      aria-label="Carregando conversa"
      className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
    >
      <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-zinc-200 px-4">
        <div className="flex min-w-0 items-center gap-3">
          <ShimmerBlock className="h-8 w-8 rounded-full" />
          <ShimmerBlock className="h-4 w-36 rounded-md" />
        </div>
        <div className="flex items-center gap-2">
          <ShimmerBlock className="h-8 w-8 rounded-lg" />
          <ShimmerBlock className="h-8 w-8 rounded-lg" />
        </div>
      </header>
      <div className="min-h-0 flex-1 overflow-hidden px-4 py-5">
        <div className="flex h-full flex-col justify-end gap-4">
          {MESSAGE_ROWS.map((row, index) => (
            <SkeletonMessage
              key={index}
              align={row.align}
              widthClass={row.width}
            />
          ))}
        </div>
      </div>
      <div className="shrink-0 border-t border-zinc-200 px-4 py-3">
        <ShimmerBlock className="h-11 w-full rounded-2xl" />
      </div>
    </section>
  );
}

/**
 * Uma bolha falsa de mensagem, alinhada à esquerda ou à direita.
 * À esquerda inclui o círculo do avatar, como no histórico real.
 */
function SkeletonMessage({
  align,
  widthClass,
}: {
  align: "start" | "end";
  widthClass: string;
}) {
  const isIncoming = align === "start";

  return (
    <div
      className={`flex items-end gap-2 ${
        isIncoming ? "justify-start" : "justify-end"
      }`}
    >
      {isIncoming ? <ShimmerBlock className="h-8 w-8 rounded-full" /> : null}
      <ShimmerBlock className={`h-10 ${widthClass} rounded-2xl`} />
    </div>
  );
}

/**
 * Retângulo com o brilho que atravessa o placeholder.
 * Só aplica a classe de shimmer; o tamanho vem do className.
 */
function ShimmerBlock({ className }: { className: string }) {
  return <span className={`chat-shimmer block ${className}`} />;
}
