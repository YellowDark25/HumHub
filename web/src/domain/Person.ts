import type { User } from "./User";

export const FRIENDSHIP_STATUSES = [
  "none",
  "outgoing",
  "incoming",
  "friends",
] as const;

export type FriendshipStatus = (typeof FRIENDSHIP_STATUSES)[number];

export type PersonGroup = {
  id: number;
  name: string;
};

export type Person = User & {
  isSelf: boolean;
  friendship: FriendshipStatus;
  groups: PersonGroup[];
  lastSeenAt: string | null;
};

export function canMessagePerson(person: Pick<Person, "isSelf" | "friendship">) {
  return !person.isSelf && person.friendship === "friends";
}

export function isFriendshipStatus(value: unknown): value is FriendshipStatus {
  return (
    typeof value === "string" &&
    FRIENDSHIP_STATUSES.includes(value as FriendshipStatus)
  );
}
