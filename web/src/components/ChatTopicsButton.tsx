"use client";

import { useState } from "react";
import { ChatTopicIcon } from "./ChatTopicIcon";
import { ChatTopicsModal } from "./ChatTopicsModal";

type ChatTopicsButtonProps = {
  conversationId: number;
  conversationName: string;
  workspaceId: string;
};

export function ChatTopicsButton({
  conversationId,
  conversationName,
  workspaceId,
}: ChatTopicsButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="Tópicos do canal"
        title="Tópicos"
        className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-200 hover:text-zinc-800"
      >
        <ChatTopicIcon />
      </button>
      {open ? (
        <ChatTopicsModal
          conversationId={conversationId}
          conversationName={conversationName}
          workspaceId={workspaceId}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}
