"use client";

import type { ChatNotificationPreference } from "@/domain/ChatNotificationPreference";
import { ChatServerNotificationMenu } from "./ChatServerNotificationMenu";
import { ChatTopicsButton } from "./ChatTopicsButton";

type ChatServerHeaderActionsProps = {
  conversationId: number;
  conversationName: string;
  workspaceId: string;
  notificationPreference: ChatNotificationPreference | null;
};

export function ChatServerHeaderActions({
  conversationId,
  conversationName,
  workspaceId,
  notificationPreference,
}: ChatServerHeaderActionsProps) {
  if (!notificationPreference) {
    return null;
  }

  return (
    <div className="flex items-center gap-1">
      <ChatTopicsButton
        conversationId={conversationId}
        conversationName={conversationName}
        workspaceId={workspaceId}
      />
      <ChatServerNotificationMenu initialPreference={notificationPreference} />
    </div>
  );
}
