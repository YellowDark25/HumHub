export function attachMediaStream(
  element: HTMLMediaElement,
  stream: MediaStream | null,
) {
  if (element.srcObject === stream) {
    if (stream) {
      void playMediaElement(element);
    }
    return;
  }

  element.pause();
  element.srcObject = stream;
  if (stream) {
    void playMediaElement(element);
  }
}

export function detachMediaStream(
  element: HTMLMediaElement,
  stream: MediaStream | null,
) {
  element.pause();
  if (element.srcObject === stream) {
    element.srcObject = null;
  }
}

function playMediaElement(element: HTMLMediaElement) {
  return element.play().catch((error) => {
    if (isPlayAbort(error)) {
      return;
    }

    console.error("Falha ao reproduzir mídia da chamada.", error);
  });
}

function isPlayAbort(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}
