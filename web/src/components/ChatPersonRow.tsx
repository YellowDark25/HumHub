import { Avatar } from "./Avatar";
import { OnlineStatusBadge } from "./OnlineStatusBadge";

type ChatPersonRowProps = {
  name: string;
  imageUrl: string;
  subtitle: string;
  isOnline: boolean;
};

export function ChatPersonRow({
  name,
  imageUrl,
  subtitle,
  isOnline,
}: ChatPersonRowProps) {
  return (
    <>
      <span className="relative shrink-0">
        <Avatar name={name} imageUrl={imageUrl} size="sm" shape="circle" />
        <OnlineStatusBadge
          isOnline={isOnline}
          showWhenOffline
          ringClass="ring-zinc-50"
        />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm text-zinc-800">{name}</span>
        {subtitle ? (
          <span className="block truncate text-xs text-zinc-500">{subtitle}</span>
        ) : null}
      </span>
    </>
  );
}
