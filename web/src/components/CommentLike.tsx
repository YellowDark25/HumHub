"use client";

import { useLikeToggle } from "./useLikeToggle";

type CommentLikeProps = {
  commentId: number;
  likeCount: number;
  liked: boolean;
};

/**
 * Coração de curtida do comentário, à direita, com a quantidade.
 * O clique chama POST /api/comments/like e preenche o ícone quando o ator já curtiu.
 */
export function CommentLike({ commentId, likeCount, liked }: CommentLikeProps) {
  const like = useLikeToggle("/api/comments/like", { commentId }, { liked, likeCount });
  const label = like.liked ? "Descurtir" : "Curtir";

  return (
    <span className="mt-1 inline-flex shrink-0 flex-col items-center">
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
        className={`inline-flex cursor-pointer items-center gap-1 disabled:opacity-50 ${
          like.liked
            ? "text-red-500 hover:text-red-600"
            : "text-zinc-500 hover:text-zinc-800"
        }`}
      >
        <HeartIcon filled={like.liked} />
        <span className="text-xs font-semibold tabular-nums">{like.likeCount}</span>
      </button>
      {like.error ? (
        <p className="mt-1 max-w-20 text-center text-[10px] text-red-600">
          {like.error}
        </p>
      ) : null}
    </span>
  );
}

/**
 * Coração menor do comentário, no traço do Instagram.
 */
function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
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
