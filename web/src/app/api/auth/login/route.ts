import { NextResponse } from "next/server";
import { errorMessage, isForbidden } from "@/application/errors";
import { app } from "@/infrastructure/composition";
import { jsonError } from "@/infrastructure/http/jsonError";
import { setAuthToken } from "@/infrastructure/session";
import { readSafeInternalPath } from "@/shared/safeInternalPath";

const CONNECT_FALLBACK = "Não foi possível conectar ao HumHub.";

export async function POST(request: Request) {
  const input = await readLoginInput(request);

  try {
    const result = await app.login(input.username, input.password);
    await setAuthToken(result.token, result.expiresInSeconds);
    try {
      await app.getCurrentUser(result.token);
      return input.wantsRedirect
        ? redirectTo(request, input.from)
        : NextResponse.json({ ok: true });
    } catch (error) {
      if (isForbidden(error)) {
        return input.wantsRedirect
          ? redirectTo(request, "/trocar-senha")
          : NextResponse.json({ ok: true, mustChangePassword: true });
      }

      throw error;
    }
  } catch (error) {
    if (input.wantsRedirect) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", input.from);
      loginUrl.searchParams.set("erro", errorMessage(error, CONNECT_FALLBACK));
      return NextResponse.redirect(loginUrl, 303);
    }

    return jsonError(error, CONNECT_FALLBACK);
  }
}

async function readLoginInput(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body = (await request.json().catch(() => null)) as {
      username?: string;
      password?: string;
    } | null;

    return {
      username: body?.username ?? "",
      password: body?.password ?? "",
      from: "/",
      wantsRedirect: false,
    };
  }

  const form = await request.formData().catch(() => null);
  return {
    username: String(form?.get("username") ?? ""),
    password: String(form?.get("password") ?? ""),
    from: readSafeInternalPath(String(form?.get("from") ?? "")),
    wantsRedirect: true,
  };
}

function redirectTo(request: Request, path: string) {
  return NextResponse.redirect(new URL(readSafeInternalPath(path), request.url), 303);
}
