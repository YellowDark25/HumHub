import { useCallback, useEffect, useState } from "react";
import type { ChatEvent, ChatEventList, CreateChatEventInput } from "@/domain/ChatEvent";
import { readApiError } from "@/shared/readApiError";

/**
 * Estado da lista de eventos no browser.
 * Inclui recarregar e marcar interesse sem buscar de novo a lista inteira.
 */
export type ChatEventsState = {
  events: ChatEvent[];
  canCreate: boolean;
  error: string;
  isLoading: boolean;
  reload: () => Promise<void>;
  toggleInterest: (eventId: number) => Promise<void>;
};

/**
 * Carrega e atualiza eventos do servidor no browser.
 * Busca a lista quando ativo; o interesse atualiza só o cartão afetado.
 */
export function useChatEvents(spaceId: number, isOpen: boolean): ChatEventsState {
  const [list, setList] = useState<ChatEventList>({
    events: [],
    canCreate: false,
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const next = await fetchSpaceEvents(spaceId);
      setList(next);
    } catch (caught: unknown) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Não foi possível carregar os eventos.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [spaceId]);

  useEffect(() => {
    if (!isOpen || !spaceId) {
      return;
    }

    void reload();
  }, [isOpen, reload, spaceId]);

  const toggleInterest = useCallback(async (eventId: number) => {
    const updated = await postEventInterest(eventId);
    setList((current) => ({
      ...current,
      events: current.events.map((event) =>
        event.id === updated.id ? updated : event,
      ),
    }));
  }, []);

  return {
    events: list.events,
    canCreate: list.canCreate,
    error,
    isLoading,
    reload,
    toggleInterest,
  };
}

/**
 * Envia o formulário de criação para a API da intranet.
 * Em sucesso devolve o evento criado; em falha lança Error com a mensagem.
 */
export async function submitSpaceEvent(
  input: CreateChatEventInput,
): Promise<ChatEvent> {
  const body = new FormData();
  body.append("spaceId", String(input.spaceId));
  body.append("title", input.title);
  body.append("description", input.description);
  body.append("locationKind", input.locationKind);
  body.append("frequency", input.frequency);
  body.append("startsAt", input.startsAt);
  if (input.conversationId) {
    body.append("conversationId", String(input.conversationId));
  }
  body.append("locationText", input.locationText);
  if (input.image) {
    body.append("image", input.image);
  }

  const response = await fetch("/api/chat/events", {
    method: "POST",
    body,
  });
  if (!response.ok) {
    throw new Error(await readApiError(response, "Não foi possível criar o evento."));
  }

  return (await response.json()) as ChatEvent;
}

/**
 * Alterna o interesse via API da intranet.
 * Em falha lança Error com a mensagem do servidor.
 */
async function postEventInterest(eventId: number): Promise<ChatEvent> {
  const response = await fetch("/api/chat/events/interest", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ eventId }),
  });
  if (!response.ok) {
    throw new Error(
      await readApiError(response, "Não foi possível atualizar o interesse."),
    );
  }

  return (await response.json()) as ChatEvent;
}

/**
 * Busca a lista de eventos futuros do servidor.
 * GET /api/chat/events; em falha lança Error com a mensagem da API.
 */
async function fetchSpaceEvents(spaceId: number): Promise<ChatEventList> {
  const response = await fetch(`/api/chat/events?spaceId=${spaceId}`);
  if (!response.ok) {
    throw new Error(
      await readApiError(response, "Não foi possível carregar os eventos."),
    );
  }

  return (await response.json()) as ChatEventList;
}
