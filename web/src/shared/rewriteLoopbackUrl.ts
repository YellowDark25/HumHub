const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);

export function rewriteLoopbackUrl(
  serviceUrl: string,
  requestUrl: string,
  lanHost = "",
): string {
  let service: URL;
  let request: URL;
  try {
    service = new URL(serviceUrl);
    request = new URL(requestUrl);
  } catch {
    return serviceUrl;
  }

  if (!LOOPBACK_HOSTS.has(service.hostname)) {
    return service.toString().replace(/\/$/, "");
  }

  if (request.protocol === "https:") {
    service.hostname = request.hostname;
    service.port = request.port;
    if (service.protocol === "ws:") {
      service.protocol = "wss:";
    }
    if (service.protocol === "http:") {
      service.protocol = "https:";
    }
    return service.toString().replace(/\/$/, "");
  }

  const host = LOOPBACK_HOSTS.has(request.hostname)
    ? lanHost.trim()
    : request.hostname;
  if (host && !LOOPBACK_HOSTS.has(host)) {
    service.hostname = host;
  }

  return service.toString().replace(/\/$/, "");
}
