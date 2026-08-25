import type { Space } from "@/domain/Space";
import { StatCounter } from "./StatCounter";

type SpaceStatsProps = {
  space: Pick<Space, "postCount" | "memberCount" | "followerCount">;
};

export function SpaceStats({ space }: SpaceStatsProps) {
  return (
    <div className="flex flex-wrap items-center gap-6">
      <StatCounter value={space.postCount} label="Postagens" />
      <StatCounter value={space.memberCount} label="Membros" />
      <StatCounter value={space.followerCount} label="Seguidores" />
    </div>
  );
}
