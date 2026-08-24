const FALLBACK_PATH = "/";

export function readSafeInternalPath(value: string | null | undefined): string {
  const path = value?.trim() ?? "";
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("://")) {
    return FALLBACK_PATH;
  }

  return path;
}
