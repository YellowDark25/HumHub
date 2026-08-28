"use client";

import { useState } from "react";
import { readApiError } from "@/shared/readApiError";

type LikeState = {
  liked: boolean;
  likeCount: number;
};

/**
 * Alterna uma curtida com atualização otimista.
 * POST na URL; desfaz o coração e o total se a API ou a rede falhar.
 */
export function useLikeToggle(
  url: string,
  body: Record<string, number>,
  initial: LikeState,
) {
  const [liked, setLiked] = useState(initial.liked);
  const [likeCount, setLikeCount] = useState(initial.likeCount);
  const [error, setError] = useState("");
  const [isSending, setIsSending] = useState(false);

  /**
   * Envia o clique: inverte o estado na hora e confirma na API.
   */
  async function toggle() {
    if (isSending) {
      return;
    }

    const previous = { liked, likeCount };
    const nextLiked = !liked;
    setError("");
    setLiked(nextLiked);
    setLikeCount((current) => Math.max(0, current + (nextLiked ? 1 : -1)));
    setIsSending(true);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        setLiked(previous.liked);
        setLikeCount(previous.likeCount);
        setError(await readApiError(response, "Não foi possível curtir."));
        return;
      }

      const payload = (await response.json()) as LikeState;
      setLiked(payload.liked);
      setLikeCount(payload.likeCount);
    } catch {
      setLiked(previous.liked);
      setLikeCount(previous.likeCount);
      setError("Falha de rede ao curtir.");
    } finally {
      setIsSending(false);
    }
  }

  return { liked, likeCount, error, isSending, toggle };
}
