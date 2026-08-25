import { mutualServerCountLabel, type ChatMutualServer } from "@/domain/ChatMutualServer";
import type { Person } from "@/domain/Person";
import { chatWorkspaceHref } from "@/shared/chatWorkspace";
import Link from "next/link";
import { Avatar } from "./Avatar";
import { ChatDmPeerActions } from "./ChatDmPeerActions";

type ChatDmIntroProps = {
  name: string;
  username: string;
  imageUrl: string;
  userId: number | null;
  mutualServers?: ChatMutualServer[];
  peer?: Person | null;
};

export function ChatDmIntro({
  name,
  username,
  imageUrl,
  userId,
  mutualServers = [],
  peer = null,
}: ChatDmIntroProps) {
  const servers = mutualServers ?? [];
  const mutualLabel = mutualServerCountLabel(servers.length);

  return (
    <div className="px-5 pt-6 pb-2">
      <Avatar name={name} imageUrl={imageUrl} size="card" shape="circle" />
      <h2 className="mt-3 text-[32px] font-bold leading-none tracking-tight text-zinc-900">
        {name}
      </h2>
      {username ? (
        <p className="mt-1 text-[15px] text-zinc-500">{username}</p>
      ) : null}
      <p className="mt-2 text-[15px] leading-6 text-zinc-500">
        Este é o começo do seu histórico de mensagens diretas com{" "}
        <span className="font-semibold text-zinc-700">{name}</span>.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-2 text-sm text-zinc-500">
        {mutualLabel ? (
          <span className="inline-flex items-center gap-2">
            <span className="flex items-center -space-x-1.5">
              {servers.slice(0, 3).map((server) => (
                <Avatar
                  key={server.id}
                  name={server.name}
                  imageUrl={server.imageUrl}
                  size="xs"
                  shape="circle"
                />
              ))}
            </span>
            {servers.length === 1 ? (
              <Link
                href={chatWorkspaceHref(String(servers[0].id))}
                className="hover:underline"
                title={servers[0].name}
              >
                {mutualLabel}
              </Link>
            ) : (
              <span title={servers.map((server) => server.name).join(", ")}>
                {mutualLabel}
              </span>
            )}
          </span>
        ) : null}
        {mutualLabel && userId ? <span aria-hidden="true">·</span> : null}
        {peer ? <ChatDmPeerActions person={peer} /> : null}
      </div>
    </div>
  );
}
