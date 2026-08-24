import type { ChatSidebarSection, ChatWorkspace } from "@/domain/ChatWorkspace";
import type { Space } from "@/domain/Space";
import type { User } from "@/domain/User";
import type { ReactNode } from "react";
import { ChatChannelSidebar } from "./ChatChannelSidebar";
import { ChatServerRail } from "./ChatServerRail";

type ChatShellProps = {
  workspaces: ChatWorkspace[];
  currentWorkspace: ChatWorkspace;
  sections: ChatSidebarSection[];
  currentUser: User | null;
  spacesWithoutServer: Space[];
  activeConversationId?: number;
  hideNavigationOnMobile?: boolean;
  children: ReactNode;
};

export function ChatShell({
  workspaces,
  currentWorkspace,
  sections,
  currentUser,
  spacesWithoutServer,
  activeConversationId,
  hideNavigationOnMobile = false,
  children,
}: ChatShellProps) {
  return (
    <div className="grid h-full min-h-0 flex-1 overflow-hidden bg-white lg:grid-cols-[80px_288px_minmax(0,1fr)]">
      <ChatServerRail
        workspaces={workspaces}
        currentWorkspaceId={currentWorkspace.id}
        currentUser={currentUser}
        spacesWithoutServer={spacesWithoutServer}
        hiddenOnMobile={hideNavigationOnMobile}
      />
      <ChatChannelSidebar
        workspace={currentWorkspace}
        sections={sections}
        currentUser={currentUser}
        activeConversationId={activeConversationId}
        hiddenOnMobile={hideNavigationOnMobile}
      />
      <div className="flex min-h-0 min-w-0 flex-col overflow-hidden">{children}</div>
    </div>
  );
}
