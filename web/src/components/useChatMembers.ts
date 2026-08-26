import { useEffect, useState } from "react";
import type { ChatMember } from "@/domain/ChatMember";
import { markSelfOnline } from "@/domain/ChatMember";
import { readApiError } from "@/shared/readApiError";

/**
 * Carrega o roster do canal quando a lista lateral abre.
 * Chama GET /api/chat/channels/:id/members e marca o usuário atual como online.
 */
export function useChatMembers(
  conversationId: number,
  currentUserId: number,
  isOpen: boolean,
) {
  const [members, setMembers] = useState<ChatMember[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !conversationId) {
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError("");

    void loadMembers(conversationId)
      .then((items) => {
        if (!cancelled) {
          setMembers(markSelfOnline(items, currentUserId));
        }
      })
      .catch((caught: unknown) => {
        if (!cancelled) {
          setError(
            caught instanceof Error
              ? caught.message
              : "Não foi possível carregar os membros.",
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
  }, [conversationId, currentUserId, isOpen]);

  return { members, error, isLoading };
}

/**
 * Busca o roster do canal na API da intranet.
 * Lê `{ members }` ou lança o erro traduzido da resposta.
 */
async function loadMembers(conversationId: number): Promise<ChatMember[]> {
  const response = await fetch(`/api/chat/channels/${conversationId}/members`);
  if (!response.ok) {
    throw new Error(
      await readApiError(response, "Não foi possível carregar os membros."),
    );
  }

  const payload = (await response.json()) as { members?: ChatMember[] };
  return payload.members ?? [];
}
