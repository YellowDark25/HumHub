"use client";

import { usePostLike } from "./usePostLike";

type PostLikeProps = {
  postId: number;
  likeCount: number;
  liked: boolean;
};

/**
 * Coração de curtida no estilo Instagram, com a quantidade ao lado.
 * O clique chama POST /api/posts/like e preenche o ícone quando o ator já curtiu.
 */
export function PostLike({ postId, likeCount, liked }: PostLikeProps) {
  const like = usePostLike(postId, { liked, likeCount });
  const label = like.liked ? "Descurtir" : "Curtir";

  return (
    <span className="inline-flex flex-col">
      <button
        type="button"
        onClick={() => void like.toggle()}
        disabled={like.isSending}
        aria-pressed={like.liked}
        aria-label={
          like.likeCount === 0
            ? label
            : `${like.likeCount} curtida${like.likeCount === 1 ? "" : "s"}`
        }
        className={`inline-flex cursor-pointer items-center gap-1.5 disabled:opacity-50 ${
          like.liked
            ? "text-red-500 hover:text-red-600"
            : "text-zinc-800 hover:text-zinc-950"
        }`}
      >
        <HeartIcon filled={like.liked} />
        <span className="text-sm font-semibold tabular-nums">{like.likeCount}</span>
      </button>
      {like.error ? (
        <p className="mt-1 text-xs text-red-600">{like.error}</p>
      ) : null}
    </span>
  );
}

/**
 * Coração no traço do Instagram.
 * Contorno quando livre; preenchido quando o ator já curtiu.
 */
function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M16.792 3.904A4.989 4.989 0 0 1 21.5 9.122c0 3.078-2.584 4.72-5.246 7.021C15.042 17.233 13.5 18.5 12 18.5s-3.042-1.267-4.254-2.357C5.084 13.842 2.5 12.2 2.5 9.122a4.989 4.989 0 0 1 4.708-5.218 4.21 4.21 0 0 1 3.675 1.941c.84 1.175.98 1.763 1.12 1.763s.278-.588 1.12-1.763a4.21 4.21 0 0 1 3.675-1.941Z" />
    </svg>
  );
}
