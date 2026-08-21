import { isUnauthorized } from "@/application/errors";
import { RequiredPasswordForm } from "@/components/RequiredPasswordForm";
import { app } from "@/infrastructure/composition";
import {
  redirectToClearSession,
  requirePageToken,
} from "@/infrastructure/pageSession";
import { APP_NAME } from "@/shared/appName";
import { redirect } from "next/navigation";

export default async function TrocarSenhaPage() {
  const token = await requirePageToken();

  try {
    await app.getCurrentUser(token);
    redirect("/");
  } catch (error) {
    if (isUnauthorized(error)) {
      redirectToClearSession();
    }
  }

  return (
    <div className="min-h-full bg-zinc-100">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center px-4">
          <p className="text-base font-semibold text-zinc-900">{APP_NAME}</p>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-md flex-col px-5 py-16">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
          Definir nova senha
        </h1>
        <p className="mt-2 mb-8 text-sm leading-6 text-zinc-600">
          No primeiro acesso você precisa escolher uma senha nova para continuar.
        </p>
        <div className="rounded-2xl border border-zinc-200 bg-white p-6">
          <RequiredPasswordForm />
        </div>
        <a
          href="/api/auth/logout"
          className="mt-6 w-full text-center text-sm font-medium text-zinc-500 hover:text-zinc-800"
        >
          Voltar para o login
        </a>
      </main>
    </div>
  );
}
