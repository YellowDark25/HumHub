"use client";

import type { ReactNode } from "react";
import { Avatar } from "./Avatar";
import { CommentLike } from "./CommentLike";
import { useCommentThread } from "./useCommentThread";
import type { Comment } from "@/domain/Comment";
import { formatDate } from "@/shared/format";

type CommentThreadProps = {
  postId: number;
  total: number;
  leading?: ReactNode;
};

/** Altura visível de cerca de três comentários; o resto rola. */
const COMMENT_LIST_VIEWPORT = "max-h-72 overflow-y-auto pr-1";

/**
 * Comentários da publicação: ícone de balão e a quantidade ao lado.
 * Começa fechado; ao abrir mostra três por vez com scroll (até 50) e carregar mais.
 * `leading` entra à esquerda do balão (curtidas do post).
 */
export function CommentThread({ postId, total, leading }: CommentThreadProps) {
  const thread = useCommentThread(postId, total);

  return (
    <div className="mt-4 border-t border-zinc-100 pt-3">
      <div className="flex items-center gap-4">
        {leading}
        <button
          type="button"
          onClick={thread.toggle}
          aria-expanded={thread.open}
          aria-label={
            thread.count === 0
              ? "Comentar"
              : `${thread.count} comentário${thread.count === 1 ? "" : "s"}`
          }
          className="inline-flex cursor-pointer items-center gap-1.5 text-zinc-800 hover:text-zinc-950"
        >
          <ThoughtIcon />
          <span className="text-sm font-semibold tabular-nums">{thread.count}</span>
        </button>
      </div>
      {thread.error ? (
        <p className="mt-2 text-xs text-red-600">{thread.error}</p>
      ) : null}
      {thread.open ? (
        <div className="mt-3 flex flex-col gap-3">
          <div className={`flex flex-col gap-3 ${COMMENT_LIST_VIEWPORT}`}>
            {thread.comments.map((comment) => (
              <CommentItem key={comment.id} comment={comment} />
            ))}
            {thread.isLoading && thread.comments.length === 0 ? (
              <p className="text-sm text-zinc-500">Carregando comentários…</p>
            ) : null}
            {thread.hasMore ? (
              <button
                type="button"
                disabled={thread.isLoading}
                onClick={() => void thread.loadMore()}
                className="cursor-pointer text-left text-sm font-medium text-teal-700 disabled:opacity-50"
              >
                {thread.isLoading
                  ? "Carregando…"
                  : "Carregar mais comentários"}
              </button>
            ) : null}
          </div>
          <form onSubmit={thread.submit} className="flex gap-2">
            <input
              value={thread.message}
              onChange={(event) => thread.setMessage(event.target.value)}
              placeholder="Escreva um comentário…"
              className="h-10 flex-1 rounded-xl border border-zinc-200 px-3 text-sm outline-none focus:border-teal-600"
            />
            <button
              type="submit"
              disabled={thread.isSending || thread.message.trim() === ""}
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

/**
 * Um comentário do fio: foto, nome, texto, data e curtida à direita.
 */
function CommentItem({ comment }: { comment: Comment }) {
  return (
    <div className="flex items-start gap-2">
      <Avatar
        name={comment.authorName}
        imageUrl={comment.authorImageUrl}
        size="sm"
      />
      <div className="min-w-0 flex-1 rounded-xl bg-zinc-50 px-3 py-2">
        <p className="text-xs font-semibold text-zinc-800">
          {comment.authorName}
        </p>
        <p className="text-sm text-zinc-700">{comment.message}</p>
        <p className="mt-1 text-[11px] text-zinc-400">
          {formatDate(comment.publishedAt)}
        </p>
      </div>
      <CommentLike
        commentId={comment.id}
        likeCount={comment.likeCount}
        liked={comment.liked}
      />
    </div>
  );
}

/**
 * Balão de fala no traço do Instagram (comentário).
 * Só desenha o ícone; o botão pai trata clique, quantidade e acessibilidade.
 */
function ThoughtIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20.656 17.008a9.993 9.993 0 1 0-3.59 3.615L22 22Z" />
    </svg>
  );
}
