type OnlineStatusBadgeProps = {
  isOnline: boolean;
  showWhenOffline?: boolean;
  size?: "sm" | "md";
  ringClass?: string;
};

const SIZE_CLASS = {
  sm: "h-2.5 w-2.5 ring-2",
  md: "h-4 w-4 ring-[3px]",
} as const;

export function OnlineStatusBadge({
  isOnline,
  showWhenOffline = false,
  size = "sm",
  ringClass = "ring-white",
}: OnlineStatusBadgeProps) {
  if (!isOnline && !showWhenOffline) {
    return null;
  }

  return (
    <span
      className={`absolute right-0 bottom-0 rounded-full ${SIZE_CLASS[size]} ${ringClass} ${
        isOnline ? "bg-pear" : "bg-zinc-400"
      }`}
      title={isOnline ? "Online" : "Offline"}
      aria-label={isOnline ? "Online" : "Offline"}
    />
  );
}
