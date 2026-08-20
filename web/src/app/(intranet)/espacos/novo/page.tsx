import { errorMessage, isForbidden } from "@/application/errors";
import { CreateSpaceForm } from "@/components/CreateSpaceForm";
import { LoadError } from "@/components/LoadError";
import { app } from "@/infrastructure/composition";
import {
  redirectIfUnauthorized,
  requirePageToken,
} from "@/infrastructure/pageSession";
import Link from "next/link";

export default async function NovoEspacoPage() {
  const token = await requirePageToken();

  let loadError = "";

  try {
    await app.requireAdminAccess(token);
  } catch (error) {
    await redirectIfUnauthorized(error);
    loadError = isForbidden(error)
      ? "Apenas administradores podem criar espaços."
      : errorMessage(error, "Não foi possível abrir a criação de espaço.");
  }

  return (
    <main className="mx-auto max-w-xl">
      <Link href="/espacos" className="text-sm font-medium text-teal-700">
        Todos os espaços
      </Link>
      <h1 className="mt-3 text-2xl font-semibold text-zinc-900">
        Criar novo espaço
      </h1>
      <p className="mt-1 mb-6 text-sm text-zinc-500">
        Um espaço agrupa pessoas e publicações em torno de um tema.
      </p>
      {loadError ? <LoadError message={loadError} /> : <CreateSpaceForm />}
    </main>
  );
}
