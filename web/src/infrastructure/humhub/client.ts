import {
  ApplicationError,
  isTransientServerError,
} from "@/application/errors";
import { MUST_CHANGE_PASSWORD_MESSAGE } from "@/shared/mustChangePassword";
import { getHumhubUrl } from "../config";
import {
  HUMHUB_TRANSIENT_RETRY_ATTEMPTS,
  HUMHUB_TRANSIENT_RETRY_DELAY_MS,
} from "./constants";
import { readHumhubErrorMessage } from "./errors";

type HumhubRequest = {
  path: string;
  token?: string | null;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  origin?: "rest" | "app";
};

/**
 * Envia um pedido HTTP ao HumHub e devolve o JSON tipado.
 * Monta URL, cabeçalhos e corpo; se a resposta for 5xx ou a rede cair no
 * primeiro acesso, tenta de novo antes de lançar ApplicationError.
 */
export async function humhubRequest<T>(input: HumhubRequest): Promise<T> {
  const method = input.method ?? "GET";
  let lastError: unknown = new ApplicationError(
    "Não foi possível falar com o HumHub.",
    502,
  );

  for (let attempt = 1; attempt <= HUMHUB_TRANSIENT_RETRY_ATTEMPTS; attempt++) {
    try {
      return await sendHumhubRequest<T>(input);
    } catch (error) {
      lastError = error;
      if (!shouldRetryHumhubRequest(error, method, attempt)) {
        throw error;
      }

      console.warn(
        `HumHub ${method} ${input.path} falhou na tentativa ${attempt}/${HUMHUB_TRANSIENT_RETRY_ATTEMPTS}: ${error instanceof Error ? error.message : "erro desconhecido"}. Nova tentativa…`,
      );
      await wait(HUMHUB_TRANSIENT_RETRY_DELAY_MS * attempt);
    }
  }

  throw lastError;
}

/**
 * Executa um único fetch ao HumHub, sem retry.
 * Lê a resposta, trata redirect de senha obrigatória e converte HTTP/JSON inválido em ApplicationError.
 */
async function sendHumhubRequest<T>({
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

  if (body !== undefined && !isFormData(body)) {
    headers["Content-Type"] = "application/json";
  }

  const root = origin === "app" ? getHumhubUrl() : `${getHumhubUrl()}/api/v1`;
  const response = await fetch(`${root}${path}`, {
    method,
    headers,
    body:
      body === undefined
        ? undefined
        : isFormData(body)
          ? body
          : JSON.stringify(body),
    cache: "no-store",
    redirect: "manual",
  });

  if (response.status >= 300 && response.status < 400) {
    throw redirectError(response);
  }

  const isJson = (response.headers.get("content-type") ?? "").includes(
    "application/json",
  );
  const rawText = isJson ? "" : await response.text().catch(() => "");
  const payload = isJson
    ? ((await response.json().catch(() => null)) as T | { message?: string } | null)
    : null;

  if (!response.ok) {
    throw new ApplicationError(
      readHumhubErrorMessage(payload, response.status, rawText),
      response.status,
    );
  }

  if (!payload || typeof payload !== "object") {
    if (response.ok && (isFormData(body) || method === "DELETE")) {
      return {} as T;
    }

    throw new ApplicationError(
      "O HumHub não devolveu dados válidos da sessão.",
      502,
    );
  }

  return payload as T;
}

/**
 * Decide se a falha do HumHub deve ser repetida.
 * Rede sempre tenta de novo; HTTP 5xx só em GET, e nunca após a última tentativa.
 */
function shouldRetryHumhubRequest(
  error: unknown,
  method: string,
  attempt: number,
): boolean {
  if (attempt >= HUMHUB_TRANSIENT_RETRY_ATTEMPTS) {
    return false;
  }

  if (isNetworkError(error)) {
    return true;
  }

  return method === "GET" && isTransientServerError(error);
}

/**
 * Identifica queda de conexão no fetch (Docker/Windows no primeiro pedido).
 * TypeError é o que o undici lança; AbortError e ApplicationError ficam de fora.
 */
function isNetworkError(error: unknown): boolean {
  return error instanceof Error && error.name === "TypeError";
}

/**
 * Pausa entre tentativas com backoff linear (600 ms, 1,2 s, 1,8 s).
 */
function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Diz se o corpo do pedido já é multipart, para não serializar de novo.
 */
function isFormData(body: unknown): body is FormData {
  return typeof FormData !== "undefined" && body instanceof FormData;
}

/**
 * Converte um redirect do HumHub em erro de negócio.
 * must-change-password vira 403; qualquer outro Location vira 502 de sessão recusada.
 */
function redirectError(response: Response): ApplicationError {
  const location = response.headers.get("location") ?? "";
  if (location.includes("must-change-password")) {
    return new ApplicationError(MUST_CHANGE_PASSWORD_MESSAGE, 403);
  }

  return new ApplicationError("O HumHub recusou a sessão.", 502);
}
