import type { ChatSidebarSection, ChatWorkspace } from "@/domain/ChatWorkspace";
import type { User } from "@/domain/User";
import type { ReactNode } from "react";
import { ChatChannelSidebar } from "./ChatChannelSidebar";
import { ChatServerRail } from "./ChatServerRail";

type ChatShellProps = {
  workspaces: ChatWorkspace[];
  currentWorkspace: ChatWorkspace;
  sections: ChatSidebarSection[];
  currentUser: User | null;
  activeConversationId?: number;
  hideNavigationOnMobile?: boolean;
  children: ReactNode;
};

export function ChatShell({
  workspaces,
  currentWorkspace,
  sections,
  currentUser,
  activeConversationId,
  hideNavigationOnMobile = false,
  children,
}: ChatShellProps) {
  return (
    <div className="grid h-full min-h-0 flex-1 overflow-hidden bg-white lg:grid-cols-[72px_260px_minmax(0,1fr)]">
      <ChatServerRail
        workspaces={workspaces}
        currentWorkspaceId={currentWorkspace.id}
        hiddenOnMobile={hideNavigationOnMobile}
      />
      <ChatChannelSidebar
        workspace={currentWorkspace}
        sections={sections}
        currentUser={currentUser}
        activeConversationId={activeConversationId}
        hiddenOnMobile={hideNavigationOnMobile}
      />
      <div className="flex min-h-0 min-w-0 flex-col">{children}</div>
    </div>
  );
}
