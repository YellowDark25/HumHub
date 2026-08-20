import { errorMessage, isNotFound } from "@/application/errors";
import { ChatComposer } from "@/components/ChatComposer";
import { LoadError } from "@/components/LoadError";
import type { ChatMessage } from "@/domain/ChatMessage";
import type { Conversation } from "@/domain/Conversation";
import { app } from "@/infrastructure/composition";
import {
  redirectIfUnauthorized,
  requirePageToken,
} from "@/infrastructure/pageSession";
import { formatDate } from "@/shared/format";
import Link from "next/link";
import { notFound } from "next/navigation";

type ChatViewProps = {
  params: Promise<{ id: string }>;
};

export default async function ChatViewPage({ params }: ChatViewProps) {
  const { id } = await params;
  const conversationId = Number(id);
  const token = await requirePageToken();

  if (!Number.isFinite(conversationId) || conversationId <= 0) {
    notFound();
  }

  let current: Conversation | undefined;
  let channels: Conversation[] = [];
  let dms: Conversation[] = [];
  let messages: ChatMessage[] = [];
  let loadError = "";

  try {
    const page = await app.getConversationPage(token, conversationId);
    current = page.current;
    channels = page.lists.channels;
    dms = page.lists.dms;
    messages = page.messages;
  } catch (error) {
    await redirectIfUnauthorized(error);
    if (isNotFound(error)) {
      notFound();
    }
    loadError = errorMessage(error, "Não foi possível carregar a conversa.");
  }

  if (!current) {
    if (loadError) {
      return (
        <main>
          <LoadError message={loadError} />
        </main>
      );
    }
    notFound();
  }

  return (
    <div className="grid min-h-[70vh] overflow-hidden rounded-2xl border border-zinc-200 bg-white lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="hidden border-r border-zinc-200 p-4 lg:block">
        <Link href="/chat" className="mb-4 block text-lg font-semibold text-zinc-900">
          Chat
        </Link>
        {[...channels, ...dms].map((item) => (
          <Link
            key={item.id}
            href={`/chat/${item.id}`}
            className={`block rounded-xl px-3 py-2 text-sm ${
              item.id === conversationId
                ? "bg-teal-50 font-medium text-teal-900"
                : "text-zinc-700 hover:bg-zinc-100"
            }`}
          >
            {item.kind === "channel" ? "# " : "@ "}
            {item.name}
          </Link>
        ))}
      </aside>
      <section className="flex min-h-[70vh] flex-col">
        <header className="border-b border-zinc-200 px-4 py-3">
          <Link href="/chat" className="text-xs font-medium text-teal-700 lg:hidden">
            Voltar
          </Link>
          <h1 className="text-base font-semibold text-zinc-900">
            {current.kind === "channel" ? "#" : "@"} {current.name}
          </h1>
        </header>
        <div className="flex flex-1 flex-col justify-end gap-3 overflow-y-auto p-4">
          {loadError ? <LoadError message={loadError} /> : null}
          {messages.length === 0 && !loadError ? (
            <p className="text-sm text-zinc-500">Nenhuma mensagem ainda.</p>
          ) : (
            messages.map((message) => (
              <div key={message.id}>
                <p className="text-xs font-semibold text-zinc-700">
                  {message.authorName}
                  <span className="ml-2 font-normal text-zinc-400">
                    {formatDate(message.publishedAt)}
                  </span>
                </p>
                <p className="text-sm text-zinc-800">
                  {message.isDeleted ? "Mensagem excluída" : message.content}
                </p>
              </div>
            ))
          )}
        </div>
        <ChatComposer conversationId={conversationId} />
      </section>
    </div>
  );
}

