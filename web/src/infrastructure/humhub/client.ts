import { ApplicationError } from "@/application/errors";
import { MUST_CHANGE_PASSWORD_MESSAGE } from "@/shared/mustChangePassword";
import { getHumhubUrl } from "../config";
import { readHumhubErrorMessage } from "./errors";

type HumhubRequest = {
  path: string;
  token?: string | null;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  origin?: "rest" | "app";
};

function isFormData(body: unknown): body is FormData {
  return typeof FormData !== "undefined" && body instanceof FormData;
}

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
  const payload = isJson
    ? ((await response.json().catch(() => null)) as T | { message?: string } | null)
    : null;

  if (!response.ok) {
    throw new ApplicationError(
      readHumhubErrorMessage(payload, response.status),
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

function redirectError(response: Response): ApplicationError {
  const location = response.headers.get("location") ?? "";
  if (location.includes("must-change-password")) {
    return new ApplicationError(MUST_CHANGE_PASSWORD_MESSAGE, 403);
  }

  return new ApplicationError("O HumHub recusou a sessão.", 502);
}
