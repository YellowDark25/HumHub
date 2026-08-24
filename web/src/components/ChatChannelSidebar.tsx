import type {
  ChatSidebarItem,
  ChatSidebarSection,
  ChatWorkspace,
} from "@/domain/ChatWorkspace";
import type { User } from "@/domain/User";
import { chatConversationHref } from "@/shared/chatWorkspace";
import Link from "next/link";
import { ChatChannelItem } from "./ChatChannelItem";
import { ChatContactButton } from "./ChatContactButton";
import { ChatCreateChannelButton } from "./ChatCreateChannelButton";
import { ChatPaneHeader } from "./ChatPaneHeader";
import { ChatPersonRow } from "./ChatPersonRow";
import { ChatUserPanel } from "./ChatUserPanel";
import { ChatVoiceConnectionBar } from "./ChatVoiceConnectionBar";
import { ChatVoiceOccupancyProvider } from "./ChatVoiceOccupancy";

type ChatChannelSidebarProps = {
  workspace: ChatWorkspace;
  sections: ChatSidebarSection[];
  currentUser: User | null;
  activeConversationId?: number;
  hiddenOnMobile?: boolean;
};

export function ChatChannelSidebar({
  workspace,
  sections,
  currentUser,
  activeConversationId,
  hiddenOnMobile = false,
}: ChatChannelSidebarProps) {
  const isHome = workspace.kind === "home";

  return (
    <aside
      className={`${
        hiddenOnMobile ? "hidden lg:flex" : "flex"
      } min-h-0 flex-col border-b border-zinc-200 bg-zinc-50 lg:border-r lg:border-b-0`}
    >
      <ChatPaneHeader title={<p className="truncate">{workspace.name}</p>} />
      <ChatVoiceOccupancyProvider currentUserId={currentUser?.id ?? null}>
        <div
          className={`flex flex-1 flex-col overflow-y-auto p-2.5 ${
            isHome ? "gap-1.5" : "gap-6 p-3.5"
          }`}
        >
          {sections.map((section) => (
            <SidebarSection
              key={section.title}
              section={section}
              workspaceId={workspace.id}
              workspaceName={workspace.name}
              spaceId={workspace.spaceId}
              hideTitle={isHome && section.title === workspace.name}
              activeConversationId={activeConversationId}
            />
          ))}
        </div>
        <ChatVoiceConnectionBar />
        {currentUser ? <ChatUserPanel user={currentUser} /> : null}
      </ChatVoiceOccupancyProvider>
    </aside>
  );
}

function SidebarSection({
  section,
  workspaceId,
  workspaceName,
  spaceId,
  hideTitle,
  activeConversationId,
}: {
  section: ChatSidebarSection;
  workspaceId: string;
  workspaceName: string;
  spaceId: number | null;
  hideTitle: boolean;
  activeConversationId?: number;
}) {
  const canCreate = Boolean(section.createChannelType);

  return (
    <section>
      {hideTitle ? null : (
        <h2 className="mb-2.5 flex items-center justify-between gap-2 px-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          <span>{section.title}</span>
          {section.createChannelType ? (
            <ChatCreateChannelButton
              workspaceId={workspaceId}
              spaceId={spaceId}
              categoryName={section.title}
              defaultType={section.createChannelType}
            />
          ) : null}
        </h2>
      )}
      {section.items.length === 0 && !canCreate ? (
        <p className="px-2 text-sm text-zinc-400">Nenhum item.</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {section.items.map((item) => (
            <li key={item.key}>
              <SidebarItem
                item={item}
                workspaceId={workspaceId}
                workspaceName={workspaceName}
                categoryName={section.title}
                isActive={item.conversationId === activeConversationId}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function SidebarItem({
  item,
  workspaceId,
  workspaceName,
  categoryName,
  isActive,
}: {
  item: ChatSidebarItem;
  workspaceId: string;
  workspaceName: string;
  categoryName: string;
  isActive: boolean;
}) {
  if (isPersonItem(item)) {
    if (!item.conversationId && item.userId) {
      return (
        <ChatContactButton
          userId={item.userId}
          name={item.name}
          imageUrl={item.imageUrl}
          subtitle={item.subtitle}
          isOnline={item.isOnline}
        />
      );
    }

    if (item.conversationId) {
      return (
        <Link
          href={chatConversationHref(item.conversationId, workspaceId)}
          className={`flex items-center gap-2.5 rounded-lg px-2 py-2 ${
            isActive ? "bg-zinc-200" : "hover:bg-zinc-200/70"
          }`}
        >
          <ChatPersonRow
            name={item.name}
            imageUrl={item.imageUrl}
            subtitle={item.subtitle}
            isOnline={item.isOnline}
          />
        </Link>
      );
    }
  }

  return (
    <ChatChannelItem
      item={item}
      workspaceId={workspaceId}
      workspaceName={workspaceName}
      categoryName={categoryName}
      isActive={isActive}
    />
  );
}

function isPersonItem(item: ChatSidebarItem) {
  return item.kind === "dm" || item.kind === "contact" || item.kind === "invite";
}

