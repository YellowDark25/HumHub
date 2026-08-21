import type { ChatWorkspace } from "@/domain/ChatWorkspace";

type ChatWelcomeProps = {
  workspace: ChatWorkspace;
};

export function ChatWelcome({ workspace }: ChatWelcomeProps) {
  const isHome = workspace.kind === "home";

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
      <p className="text-4xl font-semibold text-zinc-200">
        {isHome ? "@" : "#"}
      </p>
      <h1 className="mt-3 text-lg font-semibold text-zinc-900">
        {isHome ? "Mensagens diretas" : `Bem-vindo a ${workspace.name}`}
      </h1>
      <p className="mt-2 max-w-sm text-sm text-zinc-500">
        {isHome
          ? "Selecione uma conversa ou abra um servidor na barra ao lado."
          : "Selecione um canal na barra ao lado para começar a conversar."}
      </p>
    </div>
  );
}
