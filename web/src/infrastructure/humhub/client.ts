import { ApplicationError } from "@/application/errors";
import { getHumhubUrl } from "../config";

type HumhubRequest = {
  path: string;
  token?: string | null;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  origin?: "rest" | "app";
};

export async function humhubRequest<T>({
  path,
  token,
  method = "GET",
  body,
  origin = "rest",
}: HumhubRequest): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const root = origin === "app" ? getHumhubUrl() : `${getHumhubUrl()}/api/v1`;
  const response = await fetch(`${root}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => null)) as
    | T
    | { message?: string }
    | null;

  if (!response.ok) {
    throw new ApplicationError(readErrorMessage(payload, response.status), response.status);
  }

  return payload as T;
}

function readErrorMessage(payload: unknown, status: number): string {
  if (
    payload &&
    typeof payload === "object" &&
    "message" in payload &&
    typeof payload.message === "string" &&
    payload.message
  ) {
    return payload.message;
  }

  return `HumHub retornou ${status}`;
}
