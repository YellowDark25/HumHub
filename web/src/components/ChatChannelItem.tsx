"use client";

import { useState, type ReactNode } from "react";
import type { ChatSidebarItem } from "@/domain/ChatWorkspace";
import type { ChatChannelType } from "@/domain/Conversation";
import { chatConversationHref } from "@/shared/chatWorkspace";
import Link from "next/link";
import { ChatChannelSettings } from "./ChatChannelSettings";
import { ChatInviteFriendsModal } from "./ChatInviteFriendsModal";
import { ChatVoiceOccupants, useVoiceCallDuration } from "./ChatVoiceOccupancy";
import { useVoiceCall } from "./useVoiceCall";

type ChatChannelItemProps = {
  item: ChatSidebarItem;
  workspaceId: string;
  workspaceName: string;
  categoryName: string;
  isActive: boolean;
  activeConversationId?: number;
};

export function ChatChannelItem({
  item,
  workspaceId,
  workspaceName,
  categoryName,
  isActive,
  activeConversationId,
}: ChatChannelItemProps) {
  const [settingsTab, setSettingsTab] = useState<"overview" | "invites" | "">("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const call = useVoiceCall();
  const callDuration = useVoiceCallDuration(
    item.channelType === "voice" ? item.conversationId : null,
  );

  if (!item.conversationId) {
    return (
      <span className="flex items-center gap-2 px-2 py-2 text-[15px] text-zinc-400">
        {item.name}
      </span>
    );
  }

  return (
    <div>
      <div
        className={`group flex items-center rounded-lg ${
          isActive ? "bg-zinc-200" : "hover:bg-zinc-100"
        }`}
      >
        <Link
          href={chatConversationHref(item.conversationId, workspaceId)}
          onClick={() => {
            if (item.channelType !== "voice" || !item.conversationId) {
              return;
            }
            void call.join({
              conversationId: item.conversationId,
              channelName: item.name,
              workspaceId,
            });
          }}
          className={`flex min-w-0 flex-1 items-center gap-2.5 px-2 py-2 text-[15px] ${
            isActive ? "font-medium text-zinc-900" : "text-zinc-600 group-hover:text-zinc-900"
          }`}
        >
          <span className="w-5 shrink-0 text-zinc-400">
            <ChannelIcon type={item.channelType} />
          </span>
          <span className="truncate">{item.name}</span>
        </Link>
        {callDuration || item.canManage ? (
          <div className="relative mr-1 flex h-7 min-w-12 shrink-0 items-center justify-end">
            {callDuration ? (
              <span
                className={`px-1 text-xs tabular-nums text-green-600 ${
                  item.canManage ? "group-hover:invisible group-focus-within:invisible" : ""
                }`}
                aria-label={`Duração da chamada ${callDuration}`}
              >
                {callDuration}
              </span>
            ) : null}
            {item.canManage ? (
              <div className="absolute inset-y-0 right-0 hidden items-center group-hover:flex group-focus-within:flex">
                <IconButton
                  label="Criar convite"
                  onClick={() => setInviteOpen(true)}
                >
                  <InviteIcon />
                </IconButton>
                <IconButton
                  label="Editar canal"
                  onClick={() => setSettingsTab("overview")}
                >
                  <GearIcon />
                </IconButton>
              </div>
            ) : null}
          </div>
        ) : null}
        {inviteOpen && item.conversationId ? (
          <ChatInviteFriendsModal
            conversationId={item.conversationId}
            workspaceId={workspaceId}
            workspaceName={workspaceName}
            channelName={item.name}
            channelType={item.channelType}
            onClose={() => setInviteOpen(false)}
            onEditInvites={() => {
              setInviteOpen(false);
              setSettingsTab("invites");
            }}
          />
        ) : null}
        {settingsTab && item.conversationId ? (
          <ChatChannelSettings
            conversationId={item.conversationId}
            workspaceId={workspaceId}
            categoryName={categoryName}
            initialTab={settingsTab}
            onClose={() => setSettingsTab("")}
          />
        ) : null}
      </div>
      {item.channelType === "voice" && item.conversationId ? (
        <ChatVoiceOccupants conversationId={item.conversationId} />
      ) : null}
      {item.children.length > 0 ? (
        <ChannelTopicList
          topics={item.children}
          workspaceId={workspaceId}
          activeConversationId={activeConversationId}
        />
      ) : null}
    </div>
  );
}

function ChannelTopicList({
  topics,
  workspaceId,
  activeConversationId,
}: {
  topics: ChatSidebarItem[];
  workspaceId: string;
  activeConversationId?: number;
}) {
  return (
    <ul>
      {topics.map((topic, index) => {
        const isActive = topic.conversationId === activeConversationId;

        return (
          <li key={topic.key} className="relative flex min-h-8 items-center">
            <TopicBranch
              isFirst={index === 0}
              isLast={index === topics.length - 1}
            />
            {topic.conversationId ? (
              <Link
                href={chatConversationHref(topic.conversationId, workspaceId)}
                className={`min-w-0 flex-1 truncate rounded-md px-1.5 py-1 text-[13px] ${
                  isActive
                    ? "bg-zinc-200 font-medium text-zinc-900"
                    : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
                }`}
              >
                {topic.name}
              </Link>
            ) : (
              <span className="px-1.5 text-[13px] text-zinc-400">{topic.name}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function TopicBranch({ isFirst, isLast }: { isFirst: boolean; isLast: boolean }) {
  return (
    <span className="relative w-9 shrink-0 self-stretch" aria-hidden="true">
      <span
        className={`absolute left-4.5 w-px bg-zinc-300 ${
          isFirst ? "-top-1.5" : "top-0"
        } ${isLast ? "bottom-1/2" : "bottom-0"}`}
      />
      <span className="absolute top-1/2 left-4.5 h-2.5 w-2.5 -translate-y-full rounded-bl-sm border-b border-l border-zinc-300" />
    </span>
  );
}

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className="flex h-7 w-7 items-center justify-center rounded text-zinc-500 hover:bg-zinc-300/70 hover:text-zinc-800"
    >
      {children}
    </button>
  );
}

function ChannelIcon({ type }: { type: ChatChannelType | null }) {
  if (type === "voice") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M4 10v4h3l5 4V6L7 10H4Z" />
        <path d="M16 9.5a4 4 0 0 1 0 5" />
      </svg>
    );
  }

  if (type === "forum") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M5 6h10a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H9l-4 3v-3H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z" />
      </svg>
    );
  }

  return <>#</>;
}

function InviteIcon() {
  return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="9" cy="8" r="3" />
      <path d="M4 18c.6-2.4 2.6-4 5-4s4.4 1.6 5 4" />
      <path d="M17 8v6M14 11h6" />
    </svg>
  );
}

function GearIcon() {
  return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 4v2M12 18v2M4 12h2M18 12h2M6.3 6.3l1.4 1.4M16.3 16.3l1.4 1.4M17.7 6.3l-1.4 1.4M7.7 16.3l-1.4 1.4" />
    </svg>
  );
}
