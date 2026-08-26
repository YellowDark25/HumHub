/**
 * Botão do cabeçalho que abre ou fecha a lista de membros do canal.
 * Alterna o painel lateral; fica destacado enquanto a lista estiver visível.
 */
export function ChatMembersButton({
  open,
  onToggle,
}: {
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={open}
      aria-label={open ? "Ocultar membros" : "Mostrar membros"}
      title="Membros"
      className={`flex h-8 w-8 items-center justify-center rounded-lg ${
        open
          ? "bg-zinc-200 text-zinc-800"
          : "text-zinc-500 hover:bg-zinc-200 hover:text-zinc-800"
      }`}
    >
      <PeopleIcon />
    </button>
  );
}

/**
 * Ícone de duas pessoas, no mesmo traço dos outros botões do chat.
 */
function PeopleIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="9" cy="8" r="3" />
      <path d="M3 19a6 6 0 0 1 12 0" />
      <circle cx="17" cy="9" r="2.2" />
      <path d="M17 13.5a4.8 4.8 0 0 1 4 5.5" />
    </svg>
  );
}
