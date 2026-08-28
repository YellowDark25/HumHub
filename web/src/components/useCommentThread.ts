"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { Comment, CommentPage } from "@/domain/Comment";
import { readApiError } from "@/shared/readApiError";

/**
 * Estado do fio de comentários: começa fechado e busca 50 por página.
 * GET /api/comments ao abrir ou carregar mais; POST /api/comments ao enviar.
 */
export function useCommentThread(postId: number, total: number) {
  const router = useRouter();
  const [comments, setComments] = useState<Comment[]>([]);
  const [count, setCount] = useState(total);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  /**
   * Abre ou fecha o fio.
   * Na primeira abertura busca a página 1; nas seguintes só mostra o que já veio.
   */
  function toggle() {
    if (open) {
      setOpen(false);
      return;
    }

    setOpen(true);
    if (page === 0) {
      void loadPage(1);
    }
  }

  /**
   * Busca uma página de comentários e junta à lista, sem repetir id.
   * Em falha de rede ou API, mostra o erro abaixo do ícone.
   */
  async function loadPage(nextPage: number) {
    setError("");
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/comments?postId=${postId}&page=${nextPage}`,
      );
      if (!response.ok) {
        setError(
          await readApiError(response, "Não foi possível carregar os comentários."),
        );
        return;
      }

      const payload = (await response.json()) as CommentPage;
      setComments((current) => {
        if (nextPage === 1) {
          return payload.comments;
        }

        return mergeComments(current, payload.comments);
      });
      setPage(payload.page);
      setHasMore(payload.hasMore);
    } catch {
      setError("Falha de rede ao carregar os comentários.");
    } finally {
      setIsLoading(false);
    }
  }

  /**
   * Envia um comentário novo e acrescenta no fim da lista.
   * Recusa mensagem vazia; em sucesso limpa o campo e pede refresh da página.
   */
  async function submit(event: FormEvent<HTMLFormElement>) {
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

      const created = (await response.json()) as Comment;
      setMessage("");
      setCount((current) => current + 1);
      setComments((current) => mergeComments(current, [created]));
      router.refresh();
    } catch {
      setError("Falha de rede ao comentar.");
    } finally {
      setIsSending(false);
    }
  }

  return {
    comments,
    count,
    hasMore,
    open,
    message,
    error,
    isLoading,
    isSending,
    setMessage,
    toggle,
    loadMore: () => loadPage(page + 1),
    submit,
  };
}

/**
 * Une duas listas de comentários sem repetir o mesmo id.
 */
function mergeComments(current: Comment[], incoming: Comment[]): Comment[] {
  const seen = new Set(current.map((comment) => comment.id));
  return [
    ...current,
    ...incoming.filter((comment) => !seen.has(comment.id)),
  ];
}
