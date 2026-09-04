import { ApplicationError } from "@/application/errors";
import { getHumhubUrl } from "../config";

type NexchatRequest = {
  path: string;
  token: string;
  method?: "GET" | "POST" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number>;
};

function isFormData(body: unknown): body is FormData {
  return typeof FormData !== "undefined" && body instanceof FormData;
}

export async function nexchatRequest<T>({
  path,
  token,
  method = "GET",
  body,
  query,
}: NexchatRequest): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  };

  if (body !== undefined && !isFormData(body)) {
    headers["Content-Type"] = "application/json";
  }

  const search = query
    ? `?${new URLSearchParams(
        Object.fromEntries(
          Object.entries(query).map(([key, value]) => [key, String(value)]),
        ),
      ).toString()}`
    : "";

  const response = await fetch(
    `${getHumhubUrl()}/nexchat/index/${path}${search}`,
    {
      method,
      headers,
      body:
        body === undefined
          ? undefined
          : isFormData(body)
            ? body
            : JSON.stringify(body),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new ApplicationError(`Chat retornou ${response.status}`, response.status);
  }

  return (await response.json()) as T;
}

export async function nexchatFileRequest(input: {
  token: string;
  fileId: number;
}): Promise<{ body: ArrayBuffer; contentType: string; fileName: string }> {
  const response = await fetch(
    `${getHumhubUrl()}/nexchat/index/file?id=${input.fileId}`,
    {
      headers: {
        Authorization: `Bearer ${input.token}`,
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new ApplicationError(`Chat retornou ${response.status}`, response.status);
  }

  const disposition = response.headers.get("content-disposition") ?? "";
  const fileName = readFileName(disposition) || `arquivo-${input.fileId}`;

  return {
    body: await response.arrayBuffer(),
    contentType: response.headers.get("content-type") || "application/octet-stream",
    fileName,
  };
}

function readFileName(disposition: string): string {
  const utfMatch = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utfMatch?.[1]) {
    return decodeURIComponent(utfMatch[1]);
  }

  const match = disposition.match(/filename="?([^"]+)"?/i);
  return match?.[1] ?? "";
}
