import type { SpaceMember } from "@/domain/SpaceMember";
import type { User } from "@/domain/User";
import type { AuthRepository } from "../ports/AuthRepository";
import type { FeedRepository } from "../ports/FeedRepository";
import type { SpaceRepository } from "../ports/SpaceRepository";
import { loadActivities } from "./loadActivities";
import { loadSpaceMembers } from "./loadSpaceMembers";

const SPACE_MANAGER_ROLES = new Set(["admin", "owner"]);

export async function getSpacePage(
  token: string,
  spaceId: number,
  spaces: SpaceRepository,
  feed: FeedRepository,
  auth: AuthRepository,
) {
  const [space, posts, members, user, activities] = await Promise.all([
    spaces.getById(token, spaceId),
    feed.listPosts(token, spaceId),
    loadSpaceMembers(spaces, token, spaceId),
    auth.getCurrentUser(token),
    loadActivities(feed, token, spaceId),
  ]);

  return {
    space,
    posts,
    members,
    activities,
    canManage: canManageSpace(user, members),
  };
}

function canManageSpace(user: User, members: SpaceMember[]) {
  if (user.isAdmin) {
    return true;
  }

  const membership = members.find((member) => member.user.id === user.id);
  return SPACE_MANAGER_ROLES.has(membership?.role ?? "");
}
