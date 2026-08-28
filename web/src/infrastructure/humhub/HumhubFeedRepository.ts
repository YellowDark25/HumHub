import type { FeedRepository } from "@/application/ports/FeedRepository";
import type { Activity } from "@/domain/Activity";
import type { Comment, CommentLike, CommentPage } from "@/domain/Comment";
import type { MediaFile } from "@/domain/MediaFile";
import type { Post, PostLike } from "@/domain/Post";
import { ApplicationError } from "@/application/errors";
import { getHumhubUrl } from "../config";
import { humhubRequest } from "./client";
import {
  ACTIVITY_PAGE_LIMIT,
  COMMENT_PAGE_LIMIT,
  POST_OBJECT_MODEL,
  POST_PAGE_LIMIT,
  SPACE_PAGE_LIMIT,
} from "./constants";
import {
  mapActivity,
  mapComment,
  mapCommentLike,
  mapCommentLikeItems,
  mapCommentPage,
  markCommentLikes,
  mapLikedPostIds,
  mapPost,
  mapPostLike,
  markLikedPosts,
} from "./mappers";
import { fetchSpaceDto } from "./HumhubSpaceRepository";
import type {
  HumhubActivity,
  HumhubComment,
  HumhubCommentLike,
  HumhubCommentLikes,
  HumhubLikedPosts,
  HumhubPage,
  HumhubPost,
  HumhubPostLike,
  HumhubSpace,
} from "./types";

export class HumhubFeedRepository implements FeedRepository {
  async listPosts(token: string, spaceId?: number): Promise<Post[]> {
    if (spaceId !== undefined) {
      return listPostsInSpace(token, spaceId);
    }

    return listAllPosts(token);
  }

  async publishPost(
    token: string,
    spaceId: number,
    message: string,
    files: File[] = [],
  ): Promise<Post> {
    const space = await fetchSpaceDto(token, spaceId);
    const dto = await humhubRequest<HumhubPost>({
      path: `/post/container/${space.contentcontainer_id}`,
      token,
      method: "POST",
      body: { data: { message } },
    });

    if (files.length > 0) {
      await attachPostFiles(token, dto.id, files);
      return fetchMappedPost(token, dto.id, space.id, space.name);
    }

    return mapPost(dto, space.id, space.name);
  }

  /**
   * Apaga uma publicação no HumHub REST.
   * Chama DELETE `/post/{id}`; resposta vazia conta como sucesso.
   */
  async deletePost(token: string, postId: number): Promise<void> {
    await humhubRequest<unknown>({
      path: `/post/${postId}`,
      token,
      method: "DELETE",
    });
  }

  async getPostFile(token: string, fileId: number): Promise<MediaFile> {
    const response = await fetch(
      `${getHumhubUrl()}/api/v1/file/download/${fileId}`,
      {
        headers: {
          Accept: "*/*",
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      throw new ApplicationError(
        "Arquivo não encontrado.",
        response.status === 404 ? 404 : 502,
      );
    }

    return {
      body: await response.arrayBuffer(),
      contentType: response.headers.get("content-type") ?? "application/octet-stream",
    };
  }

  async listActivities(token: string, spaceId?: number): Promise<Activity[]> {
    if (spaceId !== undefined) {
      return listActivitiesInSpace(token, spaceId);
    }

    const page = await humhubRequest<HumhubPage<HumhubActivity>>({
      path: `/activity?limit=${ACTIVITY_PAGE_LIMIT}`,
      token,
    });

    return (page.results ?? []).filter(Boolean).map(mapActivity);
  }

  /**
   * Lê uma página de comentários do post no HumHub (até COMMENT_PAGE_LIMIT).
   * Resolve o contentId, pede a página e devolve o tipo da intranet com hasMore.
   */
  async listComments(
    token: string,
    postId: number,
    page: number,
  ): Promise<CommentPage> {
    const contentId = await resolveContentId(token, postId);
    const payload = await humhubRequest<HumhubPage<HumhubComment>>({
      path: `/comment/content/${contentId}?limit=${COMMENT_PAGE_LIMIT}&page=${page}`,
      token,
    });

    const current = mapCommentPage(payload, page);
    return {
      ...current,
      comments: await withCommentLikes(token, current.comments),
    };
  }

  async addComment(
    token: string,
    postId: number,
    message: string,
  ): Promise<Comment> {
    const dto = await humhubRequest<HumhubComment>({
      path: "/comment",
      token,
      method: "POST",
      body: {
        objectModel: POST_OBJECT_MODEL,
        objectId: postId,
        Comment: { message },
      },
    });

    return mapComment(dto);
  }

  /**
   * Alterna a curtida do post no Nexchat.
   * POST /nexchat/post-like/toggle e devolve liked + likeCount.
   */
  async togglePostLike(token: string, postId: number): Promise<PostLike> {
    const dto = await humhubRequest<HumhubPostLike>({
      path: "/nexchat/post-like/toggle",
      token,
      method: "POST",
      origin: "app",
      body: { postId },
    });

    return mapPostLike(dto);
  }

  /**
   * Alterna a curtida do comentário no Nexchat.
   * POST /nexchat/comment-like/toggle e devolve liked + likeCount.
   */
  async toggleCommentLike(
    token: string,
    commentId: number,
  ): Promise<CommentLike> {
    const dto = await humhubRequest<HumhubCommentLike>({
      path: "/nexchat/comment-like/toggle",
      token,
      method: "POST",
      origin: "app",
      body: { commentId },
    });

    return mapCommentLike(dto);
  }
}

async function listActivitiesInSpace(
  token: string,
  spaceId: number,
): Promise<Activity[]> {
  const space = await fetchSpaceDto(token, spaceId);
  const page = await humhubRequest<HumhubPage<HumhubActivity>>({
    path: `/activity/container/${space.contentcontainer_id}?limit=${ACTIVITY_PAGE_LIMIT}`,
    token,
  });

  return (page.results ?? []).filter(Boolean).map(mapActivity);
}

async function listPostsInSpace(token: string, spaceId: number): Promise<Post[]> {
  const space = await fetchSpaceDto(token, spaceId);
  const page = await humhubRequest<HumhubPage<HumhubPost>>({
    path: `/post/container/${space.contentcontainer_id}?limit=${POST_PAGE_LIMIT}`,
    token,
  });

  return withLikedState(
    token,
    (page.results ?? []).map((dto) => mapPost(dto, space.id, space.name)),
  );
}

async function listAllPosts(token: string): Promise<Post[]> {
  const [postPage, spacePage] = await Promise.all([
    humhubRequest<HumhubPage<HumhubPost>>({
      path: `/post?limit=${POST_PAGE_LIMIT}`,
      token,
    }),
    humhubRequest<HumhubPage<HumhubSpace>>({
      path: `/space?limit=${SPACE_PAGE_LIMIT}`,
      token,
    }),
  ]);

  const spacesByContainer = new Map(
    (spacePage.results ?? []).map((space) => [space.contentcontainer_id, space]),
  );

  return withLikedState(
    token,
    (postPage.results ?? []).map((dto) => {
      const space = spacesByContainer.get(dto.content.metadata.contentcontainer_id);
      return mapPost(dto, space?.id ?? null, space?.name ?? null);
    }),
  );
}

/**
 * Marca quais posts da lista o ator atual já curtiu.
 * GET /nexchat/post-like?ids=…; se a leitura falhar, os posts ficam sem curtida própria.
 */
async function withLikedState(token: string, posts: Post[]): Promise<Post[]> {
  if (posts.length === 0) {
    return posts;
  }

  try {
    const ids = posts.map((post) => post.id).join(",");
    const dto = await humhubRequest<HumhubLikedPosts>({
      path: `/nexchat/post-like?ids=${ids}`,
      token,
      origin: "app",
    });

    return markLikedPosts(posts, mapLikedPostIds(dto));
  } catch (error) {
    console.error("Não foi possível ler as curtidas do feed.", error);
    return posts;
  }
}

/**
 * Junta no fio as curtidas de cada comentário.
 * GET /nexchat/comment-like?ids=…; se a leitura falhar, mantém o que o REST trouxe.
 */
async function withCommentLikes(
  token: string,
  comments: Comment[],
): Promise<Comment[]> {
  if (comments.length === 0) {
    return comments;
  }

  try {
    const ids = comments.map((comment) => comment.id).join(",");
    const dto = await humhubRequest<HumhubCommentLikes>({
      path: `/nexchat/comment-like?ids=${ids}`,
      token,
      origin: "app",
    });

    return markCommentLikes(comments, mapCommentLikeItems(dto));
  } catch (error) {
    console.error("Não foi possível ler as curtidas dos comentários.", error);
    return comments;
  }
}

async function resolveContentId(token: string, postId: number): Promise<number> {
  const post = await humhubRequest<HumhubPost>({
    path: `/post/${postId}`,
    token,
  });

  return post.content.id;
}

async function attachPostFiles(token: string, postId: number, files: File[]) {
  const form = new FormData();
  for (const file of files) {
    form.append("files[]", file, file.name);
  }

  await humhubRequest({
    path: `/post/${postId}/upload-files`,
    token,
    method: "POST",
    body: form,
  });
}

async function fetchMappedPost(
  token: string,
  postId: number,
  spaceId: number,
  spaceName: string,
): Promise<Post> {
  const dto = await humhubRequest<HumhubPost>({
    path: `/post/${postId}`,
    token,
  });

  return mapPost(dto, spaceId, spaceName);
}
