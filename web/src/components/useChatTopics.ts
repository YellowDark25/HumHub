import { useEffect, useMemo, useState } from "react";
import type { ChatTopic } from "@/domain/ChatTopic";
import { readApiError } from "@/shared/readApiError";

export function useChatTopics(conversationId: number, isOpen: boolean) {
  const [topics, setTopics] = useState<ChatTopic[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError("");

    void loadTopics(conversationId)
      .then((items) => {
        if (!cancelled) {
          setTopics(items);
        }
      })
      .catch((caught: unknown) => {
        if (!cancelled) {
          setError(
            caught instanceof Error
              ? caught.message
              : "Não foi possível carregar os tópicos.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [conversationId, isOpen]);

  const visibleTopics = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) {
      return topics;
    }

    return topics.filter((topic) => topic.name.toLowerCase().includes(term));
  }, [query, topics]);

  return {
    topics,
    visibleTopics,
    query,
    setQuery,
    error,
    isLoading,
  };
}

async function loadTopics(conversationId: number): Promise<ChatTopic[]> {
  const response = await fetch(
    `/api/chat/topics?conversationId=${conversationId}`,
  );
  if (!response.ok) {
    throw new Error(await readApiError(response, "Não foi possível carregar os tópicos."));
  }

  return (await response.json()) as ChatTopic[];
}
