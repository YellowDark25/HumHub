"use client";

import { useEffect, useRef, useState } from "react";
import type { ChatMessage } from "@/domain/ChatMessage";
import { CHAT_FILE_ACCEPT, type ComposerPanel } from "@/shared/chatComposer";
import { readApiError } from "@/shared/readApiError";
import { ChatComposerAttachments } from "./ChatComposerAttachments";
import { ChatComposerPanels } from "./ChatComposerPanels";
import { ChatComposerToolbar } from "./ChatComposerToolbar";
import { ChatTopicsModal } from "./ChatTopicsModal";
import { useChatTyping } from "./useChatTyping";
import { useChatVoiceRecorder } from "./useChatVoiceRecorder";

type ChatComposerProps = {
  conversationId: number;
  workspaceId?: string;
  conversationName?: string;
  placeholder: string;
  onSent?: (message: ChatMessage) => void;
};

export function ChatComposer({
  conversationId,
  workspaceId,
  conversationName,
  placeholder,
  onSent,
}: ChatComposerProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [panel, setPanel] = useState<ComposerPanel>("");
  const [topicsOpen, setTopicsOpen] = useState(false);
  const [error, setError] = useState("");
  const [isSending, setIsSending] = useState(false);
  const recorder = useChatVoiceRecorder();
  const typing = useChatTyping(conversationId);
  const recordingRef = useRef(recorder);
  recordingRef.current = recorder;

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setPanel("");
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") {
        return;
      }
      if (recordingRef.current.isRecording) {
        recordingRef.current.cancel();
        return;
      }
      setPanel("");
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  async function sendMessage(extraFiles: File[] = []) {
    const trimmed = content.trim();
    const outgoing = [...files, ...extraFiles];
    if (!trimmed && outgoing.length === 0) {
      return;
    }

    setError("");
    setIsSending(true);
    try {
      const response = await postMessage(conversationId, trimmed, outgoing);
      if (!response.ok) {
        setError(
          await readApiError(response, "Não foi possível enviar a mensagem."),
        );
        return;
      }

      const sent = (await response.json()) as ChatMessage;
      typing.notify(false);
      setContent("");
      setFiles([]);
      setPanel("");
      onSent?.(sent);
    } catch {
      setError("Falha de rede ao enviar.");
    } finally {
      setIsSending(false);
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  }

  function openFilePicker() {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.accept = CHAT_FILE_ACCEPT;
    input.addEventListener(
      "change",
      () => {
        addFiles(input.files);
      },
      { once: true },
    );
    input.click();
  }

  function addFiles(selected: FileList | null) {
    if (!selected?.length) {
      return;
    }

    setFiles((current) => [...current, ...Array.from(selected)]);
    setPanel("");
  }

  function insertEmoji(emoji: string) {
    setContent((current) => `${current}${emoji}`);
  }

  async function toggleRecord() {
    if (recorder.isRecording) {
      const audio = await recorder.stop();
      if (!audio) {
        setError("Não foi possível gravar o áudio.");
        return;
      }
      await sendMessage([audio]);
      return;
    }

    setPanel("");
    await recorder.start();
  }

  return (
    <div ref={rootRef} className="relative shrink-0 px-5 pb-5">
      <ChatComposerPanels
        panel={panel}
        onSelectFile={openFilePicker}
        onOpenPanel={setPanel}
        onInsertEmoji={insertEmoji}
        onCreateTopic={
          workspaceId
            ? () => {
                setPanel("");
                setTopicsOpen(true);
              }
            : undefined
        }
      />
      {topicsOpen && workspaceId ? (
        <ChatTopicsModal
          conversationId={conversationId}
          conversationName={conversationName ?? ""}
          workspaceId={workspaceId}
          initialView="create"
          onClose={() => setTopicsOpen(false)}
        />
      ) : null}
      <form
        onSubmit={handleSubmit}
        className="overflow-hidden rounded-2xl bg-zinc-100"
      >
        <ChatComposerAttachments
          files={files}
          onRemove={(index) =>
            setFiles((current) => current.filter((_, fileIndex) => fileIndex !== index))
          }
        />
        <div className="flex items-end gap-1 px-2 py-2">
          <button
            type="button"
            disabled={recorder.isRecording}
            onClick={() => setPanel(panel === "plus" ? "" : "plus")}
            className="mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-200 hover:text-zinc-800 disabled:opacity-40"
            aria-expanded={panel === "plus"}
            aria-haspopup="menu"
            title="Abrir opções"
          >
            <PlusIcon />
          </button>
          {recorder.isRecording ? (
            <div className="flex min-h-9 flex-1 items-center gap-2 py-1.5 text-sm text-red-600">
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-600" />
              Gravando {formatVoiceTime(recorder.elapsedSeconds)}
              <button
                type="button"
                onClick={() => recorder.cancel()}
                className="text-xs font-medium text-zinc-500 hover:text-zinc-800"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <textarea
              value={content}
              onChange={(event) => {
                const next = event.target.value;
                setContent(next);
                typing.notify(next.trim().length > 0);
              }}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              rows={1}
              className="max-h-32 min-h-10 flex-1 resize-none bg-transparent py-2 text-[15px] text-zinc-800 outline-none placeholder:text-zinc-400"
            />
          )}
          <ChatComposerToolbar
            panel={panel}
            isRecording={recorder.isRecording}
            onOpenPanel={setPanel}
            onToggleRecord={() => void toggleRecord()}
          />
        </div>
      </form>
      {error || recorder.error ? (
        <p className="px-2 pt-2 text-xs text-red-600">{error || recorder.error}</p>
      ) : null}
      {isSending ? (
        <p className="px-2 pt-1 text-[11px] text-zinc-400">Enviando…</p>
      ) : null}
    </div>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

function formatVoiceTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

async function postMessage(
  conversationId: number,
  content: string,
  files: File[],
) {
  if (files.length === 0) {
    return fetch("/api/chat/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId, content }),
    });
  }

  const form = new FormData();
  form.append("conversationId", String(conversationId));
  form.append("content", content);
  for (const file of files) {
    form.append("files", file);
  }

  return fetch("/api/chat/send", {
    method: "POST",
    body: form,
  });
}
