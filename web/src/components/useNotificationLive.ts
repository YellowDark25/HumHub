"use client";

import { useEffect, useRef } from "react";
import type { NotificationLiveEvent } from "@/domain/NotificationLive";
import {
  NOTIFICATION_LIVE_POLL_MS,
  readNotificationLiveEvent,
  readUnseenCountPayload,
} from "@/shared/notificationLive";
import { readApiError } from "@/shared/readApiError";

/**
 * Mantém o cliente inscrito no stream de notificações em tempo real.
 * Abre um EventSource em `/api/notifications/live/stream`; se o SSE falhar,
 * faz fallback para polling de GET `/api/notifications/unseen`. O callback
 * mais recente é gravado num efeito (não no render) para o React Compiler
 * aceitar o ref e o efeito de conexão poder ficar com deps vazias.
 * @param onEvent recebe cada evento (contagem e, se houver, a notificação).
 */
export function useNotificationLive(
  onEvent: (event: NotificationLiveEvent) => void,
) {
  const onEventRef = useRef(onEvent);

  useEffect(() => {
    onEventRef.current = onEvent;
  });

  useEffect(() => {
    let stopped = false;
    let source: EventSource | null = null;
    let pollTimer = 0;

    /**
     * Encaminha o evento ao callback atual se o hook ainda estiver montado.
     * Lê `onEventRef` (não o `onEvent` do render) para não reabrir o stream.
     */
    function emit(event: NotificationLiveEvent) {
      if (!stopped) {
        onEventRef.current(event);
      }
    }

    /**
     * Inicia o polling da contagem não lida quando o SSE não está disponível.
     * Agenda um intervalo que, com a aba visível, chama `loadUnseenCount` e
     * emite só a contagem; não cria um segundo timer se já houver um.
     */
    function startPolling() {
      if (pollTimer || stopped) {
        return;
      }

      pollTimer = window.setInterval(() => {
        if (!document.hidden) {
          void loadUnseenCount().then((unseenCount) => {
            if (unseenCount !== null) {
              emit({ unseenCount, notification: null });
            }
          });
        }
      }, NOTIFICATION_LIVE_POLL_MS);
    }

    /**
     * Abre o EventSource de notificações e cai para polling se ele falhar.
     * Sem `EventSource`, vai direto ao polling; em erro de rede, fecha o
     * stream e chama `startPolling`.
     */
    function connectMercure() {
      if (typeof EventSource === "undefined") {
        startPolling();
        return;
      }

      source = new EventSource("/api/notifications/live/stream");
      source.onmessage = (message) => {
        try {
          const event = readNotificationLiveEvent(JSON.parse(message.data));
          if (event) {
            emit(event);
          }
        } catch (error) {
          console.error("Falha ao ler evento de notificação.", error);
        }
      };
      source.onerror = () => {
        source?.close();
        source = null;
        startPolling();
      };
    }

    connectMercure();

    return () => {
      stopped = true;
      source?.close();
      if (pollTimer) {
        window.clearInterval(pollTimer);
      }
    };
  }, []);
}

/**
 * Conta notificações não lidas do usuário autenticado.
 * Chama GET `/api/notifications/unseen`; se a rede ou a API falhar, registra
 * o erro e devolve null.
 * @returns quantidade não vista, ou null quando não foi possível obter o valor.
 */
async function loadUnseenCount() {
  try {
    const response = await fetch("/api/notifications/unseen");
    if (!response.ok) {
      console.error(
        await readApiError(response, "Não foi possível contar as notificações."),
      );
      return null;
    }

    return readUnseenCountPayload(await response.json());
  } catch (error) {
    console.error("Falha de rede ao contar as notificações.", error);
    return null;
  }
}
