"use client";

import { useEffect, useRef } from "react";
import type { NotificationLiveEvent } from "@/domain/NotificationLive";
import {
  NOTIFICATION_LIVE_POLL_MS,
  readNotificationLiveEvent,
  readUnseenCountPayload,
} from "@/shared/notificationLive";
import { readApiError } from "@/shared/readApiError";

export function useNotificationLive(
  onEvent: (event: NotificationLiveEvent) => void,
) {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    let stopped = false;
    let source: EventSource | null = null;
    let pollTimer = 0;

    function emit(event: NotificationLiveEvent) {
      if (!stopped) {
        onEventRef.current(event);
      }
    }

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
