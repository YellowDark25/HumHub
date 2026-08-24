"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { readApiError } from "@/shared/readApiError";
import { ChatPersonRow } from "./ChatPersonRow";

type ChatContactButtonProps = {
  userId: number;
  name: string;
  imageUrl: string;
  subtitle: string;
  isOnline: boolean;
};

export function ChatContactButton({
  userId,
  name,
  imageUrl,
  subtitle,
  isOnline,
}: ChatContactButtonProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isOpening, setIsOpening] = useState(false);

  async function openConversation() {
    setError("");
    setIsOpening(true);

    try {
      const response = await fetch("/api/chat/dm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        setError(await readApiError(response, "Não foi possível abrir a conversa."));
        return;
      }

      const conversation = (await response.json()) as { id: number };
      router.push(`/chat/${conversation.id}`);
    } catch {
      setError("Falha de rede ao abrir a conversa.");
    } finally {
      setIsOpening(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={openConversation}
        disabled={isOpening}
        className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left hover:bg-zinc-200/70 disabled:opacity-50"
      >
        <ChatPersonRow
          name={name}
          imageUrl={imageUrl}
          subtitle={subtitle}
          isOnline={isOnline}
        />
      </button>
      {error ? <p className="px-2 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
