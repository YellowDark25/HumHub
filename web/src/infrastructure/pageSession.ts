import { redirect } from "next/navigation";
import { isUnauthorized } from "@/application/errors";
import { getAuthToken } from "./session";

export async function requirePageToken(): Promise<string> {
  const token = await getAuthToken();
  if (!token) {
    redirect("/login");
  }

  return token;
}

export function redirectToClearSession(): never {
  redirect("/api/auth/logout");
}

export async function redirectIfUnauthorized(error: unknown): Promise<void> {
  if (!isUnauthorized(error)) {
    return;
  }

  redirectToClearSession();
}
