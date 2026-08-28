"use client";

import type { PostLike } from "@/domain/Post";
import { useLikeToggle } from "./useLikeToggle";

/**
 * Curtida da publicação no feed.
 * Encaminha o clique para POST /api/posts/like.
 */
export function usePostLike(postId: number, initial: PostLike) {
  return useLikeToggle("/api/posts/like", { postId }, initial);
}
