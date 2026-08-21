export const ONLINE_WINDOW_MS = 10 * 60 * 1000;

export function isRecentlyOnline(lastSeenAt: string | null | undefined): boolean {
  if (!lastSeenAt) {
    return false;
  }

  const parsed = Date.parse(lastSeenAt);
  if (Number.isNaN(parsed)) {
    return false;
  }

  return Date.now() - parsed <= ONLINE_WINDOW_MS;
}
