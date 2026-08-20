import { redirect } from "next/navigation";
import { isUnauthorized } from "@/application/errors";
import { clearAuthToken, getAuthToken } from "./session";

export async function requirePageToken(): Promise<string> {
  const token = await getAuthToken();
  if (!token) {
    redirect("/login");
  }

  return token;
}

export async function redirectIfUnauthorized(error: unknown): Promise<void> {
  if (!isUnauthorized(error)) {
    return;
  }

  await clearAuthToken();
  redirect("/login");
}
