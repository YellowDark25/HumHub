"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import type { ChatEvent, ChatEventChannelOption } from "@/domain/ChatEvent";
import {
  canStartChatEvent,
  eventCountLabel,
  formatEventCountdown,
} from "@/shared/chatEvent";
import { chatConversationHref } from "@/shared/chatWorkspace";
import { Avatar } from "./Avatar";
import { ChatCreateEventModal } from "./ChatCreateEventModal";
import { useVoiceCall } from "./useVoiceCall";
import type { ChatEventsState } from "./useChatEvents";

type ChatEventsModalProps = {
  spaceId: number;
  voiceChannels: ChatEventChannelOption[];
  eventsState: ChatEventsState;
  onClose: () => void;
};

/**
 * Painel de eventos do servidor.
 * Título com a quantidade, cartões com countdown, local e "Me interessa".
 */
export function ChatEventsModal({
  spaceId,
  voiceChannels,
  eventsState,
  onClose,
}: ChatEventsModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [creating, setCreating] = useState(false);
  const [startingEvent, setStartingEvent] = useState<ChatEvent | null>(null);
  const nowMs = useMinuteClock();

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();

    function handleKey(event: KeyboardEvent) {
      if (event.key !== "Escape") {
        return;
      }
      if (startingEvent) {
        setStartingEvent(null);
        return;
      }
      if (!creating) {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKey);
    };
  }, [creating, onClose, startingEvent]);

  if (creating) {
    return (
      <ChatCreateEventModal
        spaceId={spaceId}
        voiceChannels={voiceChannels}
        onClose={() => setCreating(false)}
        onCreated={() => {
          setCreating(false);
          void eventsState.reload();
        }}
      />
    );
  }

  return createPortal(
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Fechar"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="chat-events-title"
        tabIndex={-1}
        className="relative flex max-h-[min(720px,90vh)] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl outline-none"
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-zinc-200 px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <h2
              id="chat-events-title"
              className="flex items-center gap-2 text-lg font-semibold text-zinc-900"
            >
              <CalendarGlyph />
              {eventCountLabel(eventsState.events.length)}
            </h2>
            {eventsState.canCreate ? (
              <>
                <span className="h-5 w-px bg-zinc-200" aria-hidden="true" />
                <button
                  type="button"
                  onClick={() => setCreating(true)}
                  className="h-9 rounded-xl bg-teal-700 px-3 text-sm font-semibold text-white hover:bg-teal-800"
                >
                  Criar evento
                </button>
              </>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
            aria-label="Fechar"
          >
            ×
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6">
          <EventsBody
            canCreate={eventsState.canCreate}
            error={eventsState.error}
            events={eventsState.events}
            isLoading={eventsState.isLoading}
            nowMs={nowMs}
            onCreate={() => setCreating(true)}
            onStart={(event) => setStartingEvent(event)}
            onToggleInterest={eventsState.toggleInterest}
          />
        </div>
      </div>
      {startingEvent ? (
        <StartEventConfirm
          event={startingEvent}
          nowMs={nowMs}
          workspaceId={String(spaceId)}
          onCancel={() => setStartingEvent(null)}
          onStarted={onClose}
        />
      ) : null}
    </div>,
    document.body,
  );
}

/**
 * Relógio do painel, atualizado a cada meio minuto.
 * Serve só para o texto "Começa em 41m" acompanhar o tempo.
 */
function useMinuteClock() {
  const [nowMs, setNowMs] = useState(Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 10_000);
    return () => window.clearInterval(timer);
  }, []);

  return nowMs;
}

/**
 * Conteúdo do painel: carregando, erro, vazio ou lista de cartões.
 */
function EventsBody({
  canCreate,
  error,
  events,
  isLoading,
  nowMs,
  onCreate,
  onStart,
  onToggleInterest,
}: {
  canCreate: boolean;
  error: string;
  events: ChatEvent[];
  isLoading: boolean;
  nowMs: number;
  onCreate: () => void;
  onStart: (event: ChatEvent) => void;
  onToggleInterest: (eventId: number) => Promise<void>;
}) {
  if (isLoading && events.length === 0) {
    return <p className="text-sm text-zinc-500">Carregando eventos…</p>;
  }

  if (error && events.length === 0) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  if (events.length === 0) {
    return <EmptyEvents canCreate={canCreate} onCreate={onCreate} />;
  }

  return (
    <ul className="flex flex-col gap-3">
      {events.map((event) => (
        <li key={event.id}>
          <EventCard
            event={event}
            nowMs={nowMs}
            onStart={() => onStart(event)}
            onToggleInterest={onToggleInterest}
          />
        </li>
      ))}
    </ul>
  );
}

/**
 * Estado vazio quando o servidor ainda não tem eventos futuros.
 * Gestores veem o convite para criar; os demais só a mensagem.
 */
function EmptyEvents({
  canCreate,
  onCreate,
}: {
  canCreate: boolean;
  onCreate: () => void;
}) {
  return (
    <div className="flex flex-col items-center px-4 py-8 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-zinc-100 text-zinc-500">
        <CalendarGlyph className="h-9 w-9" />
      </div>
      <h3 className="mt-5 text-xl font-semibold text-zinc-900">
        Não há eventos futuros.
      </h3>
      <p className="mt-2 max-w-sm text-sm text-zinc-500">
        Agende um evento para qualquer atividade planejada no seu servidor.
      </p>
      <p className="mt-2 max-w-sm text-sm text-zinc-500">
        Você pode dar permissão para outras pessoas criarem eventos nas
        configurações do servidor.
      </p>
      {canCreate ? (
        <button
          type="button"
          onClick={onCreate}
          className="mt-5 h-10 rounded-xl bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800"
        >
          Criar evento
        </button>
      ) : null}
    </div>
  );
}

/**
 * Cartão de um evento no formato da listagem do servidor.
 * Mostra countdown, interessados, local, interesse e Começar nos 5 minutos finais.
 */
function EventCard({
  event,
  nowMs,
  onStart,
  onToggleInterest,
}: {
  event: ChatEvent;
  nowMs: number;
  onStart: () => void;
  onToggleInterest: (eventId: number) => Promise<void>;
}) {
  const [actionError, setActionError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location =
    event.locationKind === "voice"
      ? event.conversationName || "Canal de voz"
      : event.locationText;

  /**
   * Marca ou desmarca o interesse neste evento.
   * Chama a API e mostra o erro no cartão se a rede falhar.
   */
  async function handleInterest() {
    setActionError("");
    setIsSaving(true);
    try {
      await onToggleInterest(event.id);
    } catch (caught: unknown) {
      setActionError(
        caught instanceof Error
          ? caught.message
          : "Não foi possível atualizar o interesse.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  /**
   * Copia título, horário e local para a área de transferência.
   * Fecha o menu de opções depois de copiar.
   */
  async function handleShare() {
    setMenuOpen(false);
    const text = [
      event.title,
      formatEventCountdown(event.startsAt, nowMs),
      location,
      event.description,
    ]
      .filter(Boolean)
      .join("\n");
    try {
      await navigator.clipboard.writeText(text);
    } catch (caught: unknown) {
      setActionError(
        caught instanceof Error
          ? caught.message
          : "Não foi possível copiar o evento.",
      );
    }
  }

  return (
    <article className="overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50">
      {event.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={event.imageUrl} alt="" className="h-28 w-full object-cover" />
      ) : null}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-teal-700">
            <CalendarGlyph className="h-3.5 w-3.5" />
            {formatEventCountdown(event.startsAt, nowMs)}
          </p>
          <span className="flex items-center gap-1.5 text-xs text-zinc-500">
            <Avatar
              name={event.creatorName}
              imageUrl={event.creatorImageUrl}
              size="xs"
              shape="circle"
            />
            <PeopleGlyph />
            {event.interestedCount}
          </span>
        </div>
        <h3 className="mt-2 text-xl font-semibold text-zinc-900">
          {event.title}
        </h3>
        {event.description ? (
          <p className="mt-1 line-clamp-3 text-sm text-zinc-500">
            {event.description}
          </p>
        ) : null}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <p className="mr-auto flex min-w-0 items-center gap-1.5 text-sm text-zinc-600">
            {event.locationKind === "voice" ? <SpeakerGlyph /> : <PinGlyph />}
            <span className="truncate">{location}</span>
          </p>
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((current) => !current)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-200"
              aria-label="Mais opções"
            >
              ⋯
            </button>
            {menuOpen ? (
              <div className="absolute right-0 bottom-10 z-10 min-w-40 rounded-xl border border-zinc-200 bg-white py-1 shadow-lg">
                <button
                  type="button"
                  onClick={() => void handleShare()}
                  className="block w-full px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50"
                >
                  Copiar detalhes
                </button>
              </div>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => void handleShare()}
            className="flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-200"
          >
            <ShareGlyph />
            Compartilhar
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={() => void handleInterest()}
            className={`flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold ${
              event.isInterested
                ? "bg-teal-700 text-white hover:bg-teal-800"
                : "bg-emerald-600 text-white hover:bg-emerald-700"
            } disabled:opacity-60`}
          >
            ✓ Me interessa
          </button>
          {canStartChatEvent(event.startsAt, event.conversationId, nowMs) ? (
            <button
              type="button"
              onClick={onStart}
              className="flex h-9 items-center rounded-lg bg-teal-700 px-3 text-sm font-semibold text-white hover:bg-teal-800"
            >
              Começar
            </button>
          ) : null}
        </div>
        {actionError ? (
          <p className="mt-2 text-sm text-red-600">{actionError}</p>
        ) : null}
      </div>
    </article>
  );
}

/**
 * Confirmação antes de começar o evento.
 * Mostra o cartão e, ao confirmar, entra no canal escolhido (voz, se for o caso).
 */
function StartEventConfirm({
  event,
  nowMs,
  workspaceId,
  onCancel,
  onStarted,
}: {
  event: ChatEvent;
  nowMs: number;
  workspaceId: string;
  onCancel: () => void;
  onStarted: () => void;
}) {
  const router = useRouter();
  const call = useVoiceCall();
  const location =
    event.locationKind === "voice"
      ? event.conversationName || "Canal de voz"
      : event.locationText;

  /**
   * Entra no canal do evento e fecha os painéis.
   * Se for voz, também inicia a chamada; sem conversationId, só fecha.
   */
  function handleStart() {
    if (!event.conversationId) {
      onStarted();
      return;
    }

    if (event.locationKind === "voice") {
      void call.join({
        conversationId: event.conversationId,
        channelName: event.conversationName || "Canal",
        workspaceId,
        kind: "channel",
      });
    }

    router.push(chatConversationHref(event.conversationId, workspaceId));
    onStarted();
  }

  return createPortal(
    <div className="fixed inset-0 z-80 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Fechar"
        className="absolute inset-0 bg-black/50"
        onClick={onCancel}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="start-event-title"
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl"
      >
        <header className="flex items-start justify-between gap-3 px-5 pt-5">
          <div>
            <h2
              id="start-event-title"
              className="text-xl font-semibold text-zinc-900"
            >
              {event.title}
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Você está prestes a começar esse evento
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
            aria-label="Fechar"
          >
            ×
          </button>
        </header>
        <div className="px-5 py-4">
          <article className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-teal-700">
              <CalendarGlyph className="h-3.5 w-3.5" />
              {formatEventCountdown(event.startsAt, nowMs)}
            </p>
            <p className="mt-2 text-lg font-semibold text-zinc-900">
              {event.title}
            </p>
            {event.description ? (
              <p className="mt-1 text-sm text-zinc-500">{event.description}</p>
            ) : null}
            <p className="mt-3 flex items-center gap-1.5 border-t border-zinc-200 pt-3 text-sm text-zinc-600">
              {event.locationKind === "voice" ? <SpeakerGlyph /> : <PinGlyph />}
              <span className="truncate">{location}</span>
            </p>
          </article>
        </div>
        <div className="px-5 pb-5">
          <button
            type="button"
            onClick={handleStart}
            className="h-11 w-full rounded-xl bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Começar evento
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/** Ícone de calendário do painel e do estado vazio. */
function CalendarGlyph({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M8 3v4M16 3v4M4 10h16" />
    </svg>
  );
}

/** Ícone de pessoas da contagem de interessados. */
function PeopleGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5 text-zinc-400"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
      <circle cx="17" cy="9" r="2.2" />
      <path d="M16 19a4.5 4.5 0 0 1 5-4.4" />
    </svg>
  );
}

/** Ícone de compartilhar do cartão. */
function ShareGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path d="M12 4v11" />
      <path d="M8 8l4-4 4 4" />
      <path d="M5 14v5h14v-5" />
    </svg>
  );
}

/** Ícone de alto-falante para evento em canal de voz. */
function SpeakerGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4 shrink-0 text-zinc-400"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path d="M4 10v4h3l5 4V6L7 10H4Z" />
      <path d="M16 9.5a4 4 0 0 1 0 5" />
    </svg>
  );
}

/** Ícone de local para evento em outro lugar. */
function PinGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4 shrink-0 text-zinc-400"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.2" />
    </svg>
  );
}
