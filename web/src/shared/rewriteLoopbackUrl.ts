const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);

/**
 * Troca localhost da URL do LiveKit pelo host da LAN/Caddy, sem apontar para a Vercel.
 * Só reescreve quando o pedido veio de loopback, IP privado ou LIVEKIT_NODE_IP; em
 * nex-hub-teal.vercel.app devolve a URL original para o cliente não falar com o Next.
 */
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

  if (
    request.protocol === "https:" &&
    isLocalOrLanHost(request.hostname, lanHost)
  ) {
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

  if (!isLocalOrLanHost(request.hostname, lanHost)) {
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

function isLocalOrLanHost(hostname: string, lanHost: string): boolean {
  const trimmedLan = lanHost.trim();
  if (LOOPBACK_HOSTS.has(hostname) || (trimmedLan && hostname === trimmedLan)) {
    return true;
  }

  return isPrivateHostname(hostname);
}

function isPrivateHostname(hostname: string): boolean {
  const match = /^(\d+)\.(\d+)\.(\d+)\.(\d+)$/.exec(hostname);
  if (!match) {
    return false;
  }

  const first = Number(match[1]);
  const second = Number(match[2]);
  return (
    first === 10 ||
    first === 127 ||
    (first === 192 && second === 168) ||
    (first === 172 && second >= 16 && second <= 31)
  );
}
