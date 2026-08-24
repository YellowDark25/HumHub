export const HTTPS_LAN_PORT = 3443;

export const BROWSER_MEDIA_BLOCKED_MESSAGE =
  "O navegador bloqueia microfone e câmera em HTTP pelo IP. Use HTTPS ou localhost.";

export function canCaptureBrowserMedia(): boolean {
  return Boolean(
    typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia,
  );
}

export function browserMediaBlockedMessage(): string {
  if (typeof window === "undefined" || isLoopbackHost(window.location.hostname)) {
    return BROWSER_MEDIA_BLOCKED_MESSAGE;
  }

  return `O navegador bloqueia microfone e câmera neste HTTP. Abra https://${window.location.hostname}:${HTTPS_LAN_PORT} e aceite o aviso do certificado.`;
}

function isLoopbackHost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
}
