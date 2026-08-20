"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Avatar } from "./Avatar";
import type { Comment } from "@/domain/Comment";
import { formatDate } from "@/shared/format";
import { readApiError } from "@/shared/readApiError";

type CommentThreadProps = {
  postId: number;
  total: number;
  latest: Comment[];
};

export function CommentThread({ postId, total, latest }: CommentThreadProps) {
  const router = useRouter();
  const [comments, setComments] = useState(latest);
  const [count, setCount] = useState(total);
  const [open, setOpen] = useState(total > 0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSending, setIsSending] = useState(false);

  async function loadAll() {
    setError("");
    try {
      const response = await fetch(`/api/comments?postId=${postId}`);
      if (!response.ok) {
        setError(
          await readApiError(response, "Não foi possível carregar os comentários."),
        );
        return;
      }

      const payload = (await response.json()) as Comment[];
      setComments(payload);
      setOpen(true);
    } catch {
      setError("Falha de rede ao carregar os comentários.");
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) {
      return;
    }

    setError("");
    setIsSending(true);
    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, message: trimmed }),
      });

      if (!response.ok) {
        setError(await readApiError(response, "Não foi possível comentar."));
        return;
      }

      setMessage("");
      setCount((current) => current + 1);
      await loadAll();
      router.refresh();
    } catch {
      setError("Falha de rede ao comentar.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="mt-4 border-t border-zinc-100 pt-3">
      <button
        type="button"
        onClick={() => {
          if (!open) {
            void loadAll();
          } else {
            setOpen(false);
          }
        }}
        className="text-sm font-medium text-teal-700"
      >
        {count === 0 ? "Comentar" : `${count} comentário${count === 1 ? "" : "s"}`}
      </button>
      {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
      {open ? (
        <div className="mt-3 flex flex-col gap-3">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-2">
              <Avatar
                name={comment.authorName}
                imageUrl={comment.authorImageUrl}
                size="sm"
              />
              <div className="rounded-xl bg-zinc-50 px-3 py-2">
                <p className="text-xs font-semibold text-zinc-800">
                  {comment.authorName}
                </p>
                <p className="text-sm text-zinc-700">{comment.message}</p>
                <p className="mt-1 text-[11px] text-zinc-400">
                  {formatDate(comment.publishedAt)}
                </p>
              </div>
            </div>
          ))}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Escreva um comentário…"
              className="h-10 flex-1 rounded-xl border border-zinc-200 px-3 text-sm outline-none focus:border-teal-600"
            />
            <button
              type="submit"
              disabled={isSending || message.trim() === ""}
              className="h-10 rounded-xl bg-teal-700 px-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              Enviar
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
