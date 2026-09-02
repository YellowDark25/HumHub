"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type {
  ChatEventChannelOption,
  ChatEventFrequency,
  ChatEventLocationKind,
} from "@/domain/ChatEvent";
import {
  combineEventDateTime,
  EVENT_DESCRIPTION_MAX,
  EVENT_FREQUENCIES,
  EVENT_LOCATION_MAX,
  EVENT_TITLE_MAX,
  eventTimeOptions,
  formatEventWhen,
} from "@/shared/chatEvent";
import { submitSpaceEvent } from "./useChatEvents";

/** Passo atual do assistente de criação do evento. */
type WizardStep = 1 | 2 | 3;

/**
 * Rascunho do evento enquanto o usuário preenche o assistente.
 * Só vira CreateChatEventInput na última etapa.
 */
type EventDraft = {
  locationKind: ChatEventLocationKind | "";
  conversationId: number | null;
  locationText: string;
  title: string;
  description: string;
  startDate: string;
  startTime: string;
  frequency: ChatEventFrequency;
  image: File | null;
};

type ChatCreateEventModalProps = {
  spaceId: number;
  voiceChannels: ChatEventChannelOption[];
  onClose: () => void;
  onCreated: () => void;
};

const STEPS: { id: WizardStep; label: string }[] = [
  { id: 1, label: "Localização" },
  { id: 2, label: "Informações do evento" },
  { id: 3, label: "Revisar" },
];

const TIME_OPTIONS = eventTimeOptions();

/**
 * Assistente de três passos para criar um evento do servidor.
 * Local → detalhes → revisão; só envia na última etapa se o rascunho estiver completo.
 */
export function ChatCreateEventModal({
  spaceId,
  voiceChannels,
  onClose,
  onCreated,
}: ChatCreateEventModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState<WizardStep>(1);
  const [draft, setDraft] = useState<EventDraft>(() => emptyDraft(voiceChannels));
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSaving) {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKey);
    };
  }, [isSaving, onClose]);

  async function handleCreate() {
    const startsAt = combineEventDateTime(draft.startDate, draft.startTime);
    if (!draft.locationKind || !draft.title.trim() || !startsAt) {
      setError("Preencha os campos obrigatórios.");
      return;
    }

    setError("");
    setIsSaving(true);
    try {
      await submitSpaceEvent({
        spaceId,
        title: draft.title,
        description: draft.description,
        locationKind: draft.locationKind,
        conversationId: draft.conversationId,
        locationText: draft.locationText,
        startsAt,
        frequency: draft.frequency,
        image: draft.image,
      });
      onCreated();
    } catch (caught: unknown) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Não foi possível criar o evento.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-70 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Fechar"
        disabled={isSaving}
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-event-title"
        tabIndex={-1}
        className="relative flex max-h-[min(760px,92vh)] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl outline-none"
      >
        <WizardProgress step={step} />
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {step === 1 ? (
            <LocationStep
              draft={draft}
              voiceChannels={voiceChannels}
              onChange={setDraft}
            />
          ) : null}
          {step === 2 ? <DetailsStep draft={draft} onChange={setDraft} /> : null}
          {step === 3 ? <ReviewStep draft={draft} voiceChannels={voiceChannels} /> : null}
          {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
        </div>
        <WizardFooter
          step={step}
          canAdvance={canAdvance(draft, step)}
          isSaving={isSaving}
          onBack={() => setStep((current) => (current === 1 ? 1 : ((current - 1) as WizardStep)))}
          onCancel={onClose}
          onNext={() => setStep((current) => (current === 3 ? 3 : ((current + 1) as WizardStep)))}
          onCreate={() => void handleCreate()}
        />
      </div>
    </div>,
    document.body,
  );
}

/**
 * Barra de progresso do assistente.
 * Destaca o passo atual em teal.
 */
function WizardProgress({ step }: { step: WizardStep }) {
  return (
    <div className="grid grid-cols-3 gap-2 border-b border-zinc-200 px-6 pt-4 pb-3">
      {STEPS.map((item) => (
        <div key={item.id}>
          <div
            className={`h-1 rounded-full ${
              item.id <= step ? "bg-teal-600" : "bg-zinc-200"
            }`}
          />
          <p
            className={`mt-2 text-[11px] font-semibold ${
              item.id === step ? "text-teal-700" : "text-zinc-400"
            }`}
          >
            {item.label}
          </p>
        </div>
      ))}
    </div>
  );
}

/**
 * Passo 1: canal de voz ou localização livre.
 * Mostra o campo extra conforme a opção marcada.
 */
function LocationStep({
  draft,
  voiceChannels,
  onChange,
}: {
  draft: EventDraft;
  voiceChannels: ChatEventChannelOption[];
  onChange: (draft: EventDraft) => void;
}) {
  return (
    <div>
      <h2 id="create-event-title" className="text-2xl font-semibold text-zinc-900">
        Onde é seu evento?
      </h2>
      <p className="mt-1 text-sm text-zinc-500">
        Para ninguém ficar perdido e saber aonde ir.
      </p>
      <div className="mt-5 space-y-2">
        <LocationOption
          selected={draft.locationKind === "voice"}
          title="Canal de voz"
          description="Encontrem-se com voz, vídeo e compartilhamento de tela."
          icon={<SpeakerGlyph />}
          onSelect={() =>
            onChange({
              ...draft,
              locationKind: "voice",
              conversationId: draft.conversationId ?? voiceChannels[0]?.id ?? null,
            })
          }
        />
        <LocationOption
          selected={draft.locationKind === "elsewhere"}
          title="Em outro lugar"
          description="Canal de texto, link externo, ou local em pessoa."
          icon={<PinGlyph />}
          onSelect={() => onChange({ ...draft, locationKind: "elsewhere" })}
        />
      </div>
      {draft.locationKind === "voice" ? (
        <label className="mt-5 block">
          <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
            Selecione um canal <span className="text-red-500">*</span>
          </span>
          <select
            value={draft.conversationId ?? ""}
            onChange={(event) =>
              onChange({
                ...draft,
                conversationId: Number(event.target.value) || null,
              })
            }
            className="h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-800 outline-none focus:border-teal-600"
          >
            <option value="">Escolha um canal de voz</option>
            {voiceChannels.map((channel) => (
              <option key={channel.id} value={channel.id}>
                {channel.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      {draft.locationKind === "elsewhere" ? (
        <label className="mt-5 block">
          <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
            Insira uma localização <span className="text-red-500">*</span>
          </span>
          <input
            value={draft.locationText}
            onChange={(event) =>
              onChange({ ...draft, locationText: event.target.value })
            }
            maxLength={EVENT_LOCATION_MAX}
            placeholder="Coloque a localização, um link ou algo assim."
            className="h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-800 outline-none placeholder:text-zinc-400 focus:border-teal-600"
          />
        </label>
      ) : null}
    </div>
  );
}

/**
 * Opção de rádio do passo de localização.
 * Marca visualmente a escolha e dispara onSelect.
 */
function LocationOption({
  selected,
  title,
  description,
  icon,
  onSelect,
}: {
  selected: boolean;
  title: string;
  description: string;
  icon: ReactNode;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-left ${
        selected
          ? "border-teal-600 bg-teal-50"
          : "border-zinc-200 hover:bg-zinc-50"
      }`}
    >
      <span
        className={`mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
          selected ? "border-teal-600" : "border-zinc-300"
        }`}
      >
        {selected ? <span className="h-2 w-2 rounded-full bg-teal-600" /> : null}
      </span>
      <span className="mt-0.5 text-zinc-500">{icon}</span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-zinc-900">{title}</span>
        <span className="mt-0.5 block text-xs text-zinc-500">{description}</span>
      </span>
    </button>
  );
}

/**
 * Passo 2: assunto, data, hora, frequência, descrição e imagem.
 */
function DetailsStep({
  draft,
  onChange,
}: {
  draft: EventDraft;
  onChange: (draft: EventDraft) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 id="create-event-title" className="text-2xl font-semibold text-zinc-900">
          Sobre o que é o seu evento?
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Preencha os detalhes do seu evento.
        </p>
      </div>
      <Field label="Assunto do evento" required>
        <input
          value={draft.title}
          onChange={(event) => onChange({ ...draft, title: event.target.value })}
          maxLength={EVENT_TITLE_MAX}
          placeholder="Sobre o que é o seu evento?"
          className={fieldClass}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Data de início" required>
          <input
            type="date"
            value={draft.startDate}
            min={dateInputValue(new Date())}
            onChange={(event) =>
              onChange({ ...draft, startDate: event.target.value })
            }
            className={fieldClass}
          />
        </Field>
        <Field label="Hora de início" required>
          <select
            value={draft.startTime}
            onChange={(event) =>
              onChange({ ...draft, startTime: event.target.value })
            }
            className={fieldClass}
          >
            {TIME_OPTIONS.map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Frequência do evento" required>
        <select
          value={draft.frequency}
          onChange={(event) =>
            onChange({
              ...draft,
              frequency: event.target.value as ChatEventFrequency,
            })
          }
          className={fieldClass}
        >
          {EVENT_FREQUENCIES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Descrição">
        <textarea
          value={draft.description}
          onChange={(event) =>
            onChange({ ...draft, description: event.target.value })
          }
          maxLength={EVENT_DESCRIPTION_MAX}
          rows={4}
          placeholder="Conte às pessoas um pouco mais sobre o seu evento. Você pode usar novas linhas e links, se desejar."
          className={`${fieldClass} h-auto py-2.5`}
        />
      </Field>
      <CoverImageField
        image={draft.image}
        onChange={(image) => onChange({ ...draft, image })}
      />
    </div>
  );
}

/**
 * Campo de upload da imagem de apresentação.
 * Aceita um arquivo e mostra o nome escolhido.
 */
function CoverImageField({
  image,
  onChange,
}: {
  image: File | null;
  onChange: (image: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
        Imagem de apresentação
      </p>
      <p className="mt-1 text-xs text-zinc-500">
        Recomendamos uma imagem que tenha pelo menos 800px de largura e 320px de
        altura.
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={(event) => onChange(event.target.files?.[0] ?? null)}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="mt-3 h-10 rounded-xl bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800"
      >
        {image ? "Trocar imagem" : "Enviar imagem de apresentação"}
      </button>
      {image ? (
        <p className="mt-2 truncate text-xs text-zinc-500">{image.name}</p>
      ) : null}
    </div>
  );
}

/**
 * Passo 3: prévia do cartão e aviso de início automático.
 */
function ReviewStep({
  draft,
  voiceChannels,
}: {
  draft: EventDraft;
  voiceChannels: ChatEventChannelOption[];
}) {
  const location =
    draft.locationKind === "voice"
      ? voiceChannels.find((channel) => channel.id === draft.conversationId)
          ?.name ?? "Canal de voz"
      : draft.locationText;
  const previewUrl = useMemo(
    () => (draft.image ? URL.createObjectURL(draft.image) : ""),
    [draft.image],
  );

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <div>
      <h2 id="create-event-title" className="sr-only">
        Revisar
      </h2>
      <article className="overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50">
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt="" className="h-28 w-full object-cover" />
        ) : null}
        <div className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
            {formatEventWhen(combineEventDateTime(draft.startDate, draft.startTime))}
          </p>
          <h3 className="mt-1.5 text-xl font-semibold text-zinc-900">
            {draft.title.trim() || "Evento"}
          </h3>
          {draft.description.trim() ? (
            <p className="mt-1 text-sm text-zinc-500">{draft.description}</p>
          ) : null}
          <p className="mt-3 flex items-center gap-1.5 text-sm text-zinc-600">
            {draft.locationKind === "voice" ? <SpeakerGlyph /> : <PinGlyph />}
            <span className="truncate">{location}</span>
          </p>
        </div>
      </article>
      <p className="mt-4 text-sm font-medium text-zinc-800">
        Aqui está uma prévia do seu evento.
      </p>
      <p className="mt-1 text-sm text-zinc-500">
        Este evento começará automaticamente quando chegar a hora.
      </p>
    </div>
  );
}

/**
 * Rodapé do assistente: voltar, cancelar e avançar/criar.
 */
function WizardFooter({
  step,
  canAdvance,
  isSaving,
  onBack,
  onCancel,
  onNext,
  onCreate,
}: {
  step: WizardStep;
  canAdvance: boolean;
  isSaving: boolean;
  onBack: () => void;
  onCancel: () => void;
  onNext: () => void;
  onCreate: () => void;
}) {
  return (
    <div className="flex shrink-0 items-center justify-between gap-3 border-t border-zinc-200 px-6 py-4">
      {step > 1 ? (
        <button
          type="button"
          disabled={isSaving}
          onClick={onBack}
          className="h-10 px-1 text-sm font-medium text-zinc-600 hover:text-zinc-900 disabled:opacity-60"
        >
          Voltar
        </button>
      ) : (
        <span />
      )}
      <div className="flex gap-2">
        <button
          type="button"
          disabled={isSaving}
          onClick={onCancel}
          className="h-10 rounded-xl px-4 text-sm font-medium text-zinc-600 hover:bg-zinc-100 disabled:opacity-60"
        >
          Cancelar
        </button>
        {step < 3 ? (
          <button
            type="button"
            disabled={!canAdvance}
            onClick={onNext}
            className="h-10 rounded-xl bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
          >
            Próximo
          </button>
        ) : (
          <button
            type="button"
            disabled={isSaving || !canAdvance}
            onClick={onCreate}
            className="h-10 rounded-xl bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
          >
            {isSaving ? "Criando…" : "Criar evento"}
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Rótulo + controle do formulário do assistente.
 * Marca asterisco vermelho nos campos obrigatórios.
 */
function Field({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </span>
      {children}
    </label>
  );
}

const fieldClass =
  "h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-800 outline-none placeholder:text-zinc-400 focus:border-teal-600";

/**
 * Diz se o passo atual do rascunho já pode avançar.
 * Cada etapa exige os campos obrigatórios daquele passo.
 */
function canAdvance(draft: EventDraft, step: WizardStep): boolean {
  if (step === 1) {
    if (draft.locationKind === "voice") {
      return draft.conversationId !== null;
    }
    return draft.locationKind === "elsewhere" && draft.locationText.trim() !== "";
  }

  return (
    draft.title.trim() !== "" &&
    draft.startDate !== "" &&
    draft.startTime !== ""
  );
}

/**
 * Rascunho inicial do assistente.
 * Data de hoje e o próximo horário cheio; canal de voz pré-selecionado se existir.
 */
function emptyDraft(voiceChannels: ChatEventChannelOption[]): EventDraft {
  const now = new Date();
  now.setMinutes(now.getMinutes() < 30 ? 30 : 60, 0, 0);

  return {
    locationKind: "",
    conversationId: voiceChannels[0]?.id ?? null,
    locationText: "",
    title: "",
    description: "",
    startDate: dateInputValue(now),
    startTime: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
    frequency: "none",
    image: null,
  };
}

/**
 * Data no formato do input type="date".
 * Usa o fuso local do navegador.
 */
function dateInputValue(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Ícone de alto-falante da opção canal de voz. */
function SpeakerGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M4 10v4h3l5 4V6L7 10H4Z" />
      <path d="M16 9.5a4 4 0 0 1 0 5" />
    </svg>
  );
}

/** Ícone de alfinete da opção em outro lugar. */
function PinGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.2" />
    </svg>
  );
}
