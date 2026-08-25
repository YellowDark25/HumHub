import { Avatar } from "./Avatar";
import { CommentThread } from "./CommentThread";
import { PostAttachments } from "./PostAttachments";
import { RichText } from "./RichText";
import type { Post } from "@/domain/Post";
import { formatDate } from "@/shared/format";

type FeedCardProps = {
  post: Post;
};

export function FeedCard({ post }: FeedCardProps) {
  return (
    <article className="rounded-2xl border border-zinc-200 bg-white p-5">
      <header className="flex items-center gap-3">
        <Avatar name={post.authorName} imageUrl={post.authorImageUrl} />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-zinc-900">
            {post.authorName}
          </p>
          <p className="text-xs text-zinc-500">
            {formatDate(post.publishedAt)}
            {post.spaceName ? ` · ${post.spaceName}` : ""}
          </p>
        </div>
      </header>
      {post.message.trim() ? (
        <RichText text={post.message} className="mt-3" />
      ) : null}
      <PostAttachments attachments={post.attachments} />
      <p className="mt-3 text-xs text-zinc-500">
        {post.likeCount} curtida{post.likeCount === 1 ? "" : "s"}
      </p>
      <CommentThread
        postId={post.id}
        total={post.commentCount}
        latest={post.latestComments}
      />
    </article>
  );
}
