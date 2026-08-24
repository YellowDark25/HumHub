export function readPublicClientUrl(request: Request): string {
  const fallback = new URL(request.url);
  const proto =
    request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ||
    fallback.protocol.replace(":", "");
  const host =
    request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ||
    request.headers.get("host") ||
    fallback.host;

  return `${proto}://${host}${fallback.pathname}${fallback.search}`;
}
