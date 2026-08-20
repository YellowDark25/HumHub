import { errorMessage } from "@/application/errors";
import { LoadError } from "@/components/LoadError";
import { SpaceCard } from "@/components/SpaceCard";
import type { Space } from "@/domain/Space";
import { app } from "@/infrastructure/composition";
import {
  redirectIfUnauthorized,
  requirePageToken,
} from "@/infrastructure/pageSession";

export default async function EspacosPage() {
  const token = await requirePageToken();

  let spaces: Space[] = [];
  let loadError = "";

  try {
    spaces = await app.listSpaces(token);
  } catch (error) {
    await redirectIfUnauthorized(error);
    loadError = errorMessage(error, "Não foi possível carregar os espaços.");
  }

  return (
    <main>
      <h1 className="text-2xl font-semibold text-zinc-900">Espaços</h1>
      <p className="mt-1 mb-6 text-sm text-zinc-500">
        Marketing, desenvolvimento e os demais espaços da intranet.
      </p>
      {loadError ? <LoadError message={loadError} /> : null}
      {spaces.length === 0 && !loadError ? (
        <p className="text-sm text-zinc-500">Nenhum espaço disponível.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {spaces.map((space) => (
            <li key={space.id}>
              <SpaceCard space={space} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

