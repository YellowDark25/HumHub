import { ApplicationError } from "@/application/errors";
import { getHumhubUrl, getKaizzenServiceSecret } from "../config";
import { KAIZZEN_SECRET_HEADER } from "../http/requireServiceSecret";

type ServiceRequest = {
  path: string;
  method?: "GET" | "POST" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number>;
};

/**
 * Chama uma rota nexchat autenticada pelo segredo do serviço, sem JWT de usuário.
 * Usado pelo turno da secretária (reply, histórico, Google, typing).
 */
export async function nexchatServiceRequest<T>(
  input: ServiceRequest,
): Promise<T> {
  const search = input.query
    ? `?${new URLSearchParams(
        Object.fromEntries(
          Object.entries(input.query).map(([key, value]) => [key, String(value)]),
        ),
      ).toString()}`
    : "";

  const response = await fetch(
    `${getHumhubUrl()}/nexchat/index/${input.path}${search}`,
    {
      method: input.method ?? "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        [KAIZZEN_SECRET_HEADER]: getKaizzenServiceSecret(),
      },
      body: input.body === undefined ? undefined : JSON.stringify(input.body),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new ApplicationError(
      `Chat retornou ${response.status}`,
      response.status,
    );
  }

  return (await response.json()) as T;
}

/**
 * Baixa um anexo da DM da secretária com o segredo do serviço.
 */
export async function nexchatServiceFileRequest(fileId: number): Promise<{
  body: ArrayBuffer;
  contentType: string;
  fileName: string;
}> {
  const response = await fetch(
    `${getHumhubUrl()}/nexchat/index/secretary-file?id=${fileId}`,
    {
      headers: {
        [KAIZZEN_SECRET_HEADER]: getKaizzenServiceSecret(),
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new ApplicationError(
      `Chat retornou ${response.status}`,
      response.status,
    );
  }

  return {
    body: await response.arrayBuffer(),
    contentType: response.headers.get("content-type") || "application/octet-stream",
    fileName: `audio-${fileId}`,
  };
}
