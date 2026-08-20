import { errorMessage, isForbidden } from "@/application/errors";
import { LoadError } from "@/components/LoadError";
import { app } from "@/infrastructure/composition";
import {
  redirectIfUnauthorized,
  requirePageToken,
} from "@/infrastructure/pageSession";

export default async function MarketplacePage() {
  const token = await requirePageToken();

  let loadError = "";

  try {
    await app.requireAdminAccess(token);
  } catch (error) {
    await redirectIfUnauthorized(error);
    loadError = isForbidden(error)
      ? errorMessage(error, "Você não tem permissão para acessar esta área.")
      : errorMessage(error, "Não foi possível abrir o marketplace.");
  }

  return (
    <main>
      <h1 className="text-2xl font-semibold text-zinc-900">Marketplace</h1>
      <p className="mt-1 mb-6 text-sm text-zinc-500">
        Módulos e extensões disponíveis para a intranet.
      </p>
      {loadError ? (
        <LoadError message={loadError} />
      ) : (
        <p className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-sm text-zinc-500">
          Nenhum módulo listado no momento.
        </p>
      )}
    </main>
  );
}
