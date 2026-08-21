import type { ChatMessage } from "@/domain/ChatMessage";
import {
  type ChatHistoryGroup,
  groupChatHistory,
} from "@/shared/chatHistory";
import { formatChatClock, formatChatTimestamp } from "@/shared/format";
import { Avatar } from "./Avatar";

type ChatMessageHistoryProps = {
  messages: ChatMessage[];
};

export function ChatMessageHistory({ messages }: ChatMessageHistoryProps) {
  const items = groupChatHistory(messages);

  if (items.length === 0) {
    return <p className="px-4 py-6 text-sm text-zinc-500">Nenhuma mensagem ainda.</p>;
  }

  return (
    <div className="flex flex-col py-2">
      {items.map((item) =>
        item.type === "day" ? (
          <DayDivider key={item.key} label={item.label} />
        ) : (
          <MessageGroup key={item.key} group={item} />
        ),
      )}
    </div>
  );
}

function DayDivider({ label }: { label: string }) {
  return (
    <div className="my-4 flex items-center gap-3 px-4">
      <span className="h-px flex-1 bg-zinc-200" />
      <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
        {label}
      </span>
      <span className="h-px flex-1 bg-zinc-200" />
    </div>
  );
}

function MessageGroup({ group }: { group: ChatHistoryGroup }) {
  const [first, ...rest] = group.messages;

  if (!first) {
    return null;
  }

  return (
    <div>
      <article className="flex gap-3 px-4 py-1 hover:bg-zinc-50">
        <Avatar
          name={group.authorName}
          imageUrl={group.authorImageUrl}
          size="sm"
          shape="circle"
        />
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-baseline gap-x-2 leading-5">
            <span className="text-sm font-semibold text-zinc-900">
              {group.authorName}
            </span>
            <time className="text-[11px] text-zinc-400">
              {formatChatTimestamp(group.publishedAt)}
            </time>
          </p>
          <MessageBody message={first} />
        </div>
      </article>
      {rest.map((message) => (
        <article
          key={message.id}
          className="group flex gap-3 px-4 py-0.5 hover:bg-zinc-50"
        >
          <span className="flex w-8 shrink-0 justify-end pt-0.5 text-[10px] text-transparent group-hover:text-zinc-400">
            {formatChatClock(message.publishedAt)}
          </span>
          <div className="min-w-0 flex-1">
            <MessageBody message={message} />
          </div>
        </article>
      ))}
    </div>
  );
}

function MessageBody({ message }: { message: ChatMessage }) {
  if (message.isDeleted) {
    return <p className="text-sm italic text-zinc-400">Mensagem excluída</p>;
  }

  return (
    <div className="space-y-2">
      {message.content ? (
        <p className="whitespace-pre-wrap break-words text-sm leading-6 text-zinc-800">
          {message.content}
        </p>
      ) : null}
      {message.attachments.map((attachment) =>
        attachment.isAudio ? (
          <audio
            key={attachment.id}
            controls
            preload="metadata"
            src={attachment.url}
            className="h-9 max-w-full"
          >
            Seu navegador não reproduz áudio.
          </audio>
        ) : attachment.isImage ? (
          <img
            key={attachment.id}
            src={attachment.url}
            alt={attachment.name}
            className="max-h-64 rounded-lg"
          />
        ) : (
          <a
            key={attachment.id}
            href={attachment.url}
            className="text-sm text-teal-700 hover:underline"
          >
            {attachment.name}
          </a>
        ),
      )}
    </div>
  );
}
