import { ApplicationError } from "@/application/errors";
import { getAuthToken } from "../session";

export async function requireAuthToken(): Promise<string> {
  const token = await getAuthToken();
  if (!token) {
    throw new ApplicationError("Não autenticado.", 401);
  }

  return token;
}
