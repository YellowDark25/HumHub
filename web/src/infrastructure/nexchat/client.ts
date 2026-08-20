import { ApplicationError } from "@/application/errors";
import { getHumhubUrl } from "../config";

type NexchatRequest = {
  path: string;
  token: string;
  method?: "GET" | "POST";
  body?: unknown;
  query?: Record<string, string | number>;
};

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

  if (body !== undefined) {
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
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new ApplicationError(`Chat retornou ${response.status}`, response.status);
  }

  return (await response.json()) as T;
}
