import type { ChatWorkspace } from "@/domain/ChatWorkspace";
import type { Space } from "@/domain/Space";
import type { User } from "@/domain/User";
import { chatWorkspaceHref } from "@/shared/chatWorkspace";
import Link from "next/link";
import { Avatar } from "./Avatar";
import { ChatCreateServerButton } from "./ChatCreateServerButton";

type ChatServerRailProps = {
  workspaces: ChatWorkspace[];
  currentWorkspaceId: string;
  currentUser: User | null;
  spacesWithoutServer: Space[];
  hiddenOnMobile?: boolean;
};

export function ChatServerRail({
  workspaces,
  currentWorkspaceId,
  currentUser,
  spacesWithoutServer,
  hiddenOnMobile = false,
}: ChatServerRailProps) {
  const home = workspaces[0];
  const servers = workspaces.slice(1);

  return (
    <aside
      className={`${
        hiddenOnMobile ? "hidden lg:flex" : "flex"
      } shrink-0 gap-2.5 overflow-x-auto border-b border-zinc-200 bg-zinc-100 p-2.5 lg:w-20 lg:flex-col lg:items-center lg:overflow-y-auto lg:border-r lg:border-b-0 lg:py-3`}
    >
      {home ? (
        <ServerButton
          workspace={home}
          isActive={home.id === currentWorkspaceId}
        />
      ) : null}
      {servers.length > 0 ? (
        <div className="hidden h-0.5 w-8 rounded-full bg-zinc-300 lg:block" />
      ) : null}
      {servers.map((workspace) => (
        <ServerButton
          key={workspace.id}
          workspace={workspace}
          isActive={workspace.id === currentWorkspaceId}
        />
      ))}
      <ChatCreateServerButton
        canCreateNew={Boolean(currentUser?.isAdmin)}
        currentUserName={currentUser?.name ?? ""}
        spacesWithoutServer={spacesWithoutServer}
      />
    </aside>
  );
}

function ServerButton({
  workspace,
  isActive,
}: {
  workspace: ChatWorkspace;
  isActive: boolean;
}) {
  return (
    <Link
      href={chatWorkspaceHref(workspace.id)}
      title={workspace.name}
      className="relative flex shrink-0 items-center justify-center"
    >
      <span
        className={`absolute top-1/2 -left-2 hidden h-8 w-1 -translate-y-1/2 rounded-r-full bg-teal-700 transition-opacity lg:block ${
          isActive ? "opacity-100" : "opacity-0"
        }`}
      />
      <span
        className={`overflow-hidden transition-[border-radius] ${
          isActive
            ? "rounded-2xl ring-2 ring-teal-600 ring-offset-2 ring-offset-zinc-100"
            : "rounded-full hover:rounded-2xl"
        }`}
      >
        <ServerIcon workspace={workspace} />
      </span>
    </Link>
  );
}

function ServerIcon({ workspace }: { workspace: ChatWorkspace }) {
  if (workspace.kind === "home") {
    return (
      <span className="flex h-12 w-12 items-center justify-center bg-oxford text-white">
        <HomeIcon />
      </span>
    );
  }

  if (workspace.kind === "channels") {
    return (
      <span className="flex h-12 w-12 items-center justify-center bg-zinc-700 text-lg font-semibold text-white">
        #
      </span>
    );
  }

  return (
    <Avatar
      name={workspace.name}
      imageUrl={workspace.imageUrl}
      size="server"
      shape="circle"
    />
  );
}

function HomeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-7 w-7"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
