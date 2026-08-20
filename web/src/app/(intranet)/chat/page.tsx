import { errorMessage } from "@/application/errors";
import type { Conversation } from "@/domain/Conversation";
import { app } from "@/infrastructure/composition";
import {
  redirectIfUnauthorized,
  requirePageToken,
} from "@/infrastructure/pageSession";
import Link from "next/link";

function ConversationList({
  title,
  items,
}: {
  title: string;
  items: Conversation[];
}) {
  return (
    <section>
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
        {title}
      </h2>
      {items.length === 0 ? (
        <p className="text-sm text-zinc-400">Nenhum item.</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={`/chat/${item.id}`}
                className="block rounded-xl px-3 py-2 text-sm text-zinc-800 hover:bg-zinc-100"
              >
                {item.kind === "channel" ? "# " : "@ "}
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default async function ChatPage() {
  const token = await requirePageToken();

  let channels: Conversation[] = [];
  let dms: Conversation[] = [];
  let pendingInvites: Conversation[] = [];
  let error = "";

  try {
    const lists = await app.listConversations(token);
    channels = lists.channels;
    dms = lists.dms;
    pendingInvites = lists.pendingInvites;
  } catch (caught) {
    await redirectIfUnauthorized(caught);
    error = errorMessage(caught, "Não foi possível carregar o chat.");
  }

  return (
    <div className="grid min-h-[70vh] overflow-hidden rounded-2xl border border-zinc-200 bg-white lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="border-b border-zinc-200 p-4 lg:border-r lg:border-b-0">
        <h1 className="mb-4 text-lg font-semibold text-zinc-900">Chat</h1>
        {error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : (
          <div className="flex flex-col gap-5">
            {pendingInvites.length > 0 ? (
              <ConversationList title="Convites" items={pendingInvites} />
            ) : null}
            <ConversationList title="Canais" items={channels} />
            <ConversationList title="Mensagens diretas" items={dms} />
          </div>
        )}
      </aside>
      <div className="hidden items-center justify-center p-8 text-sm text-zinc-500 lg:flex">
        Selecione um canal ou uma conversa.
      </div>
    </div>
  );
}
