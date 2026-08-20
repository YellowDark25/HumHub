import { errorMessage } from "@/application/errors";
import { LoadError } from "@/components/LoadError";
import type { Space } from "@/domain/Space";
import { app } from "@/infrastructure/composition";
import {
  redirectIfUnauthorized,
  requirePageToken,
} from "@/infrastructure/pageSession";
import Link from "next/link";

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
              <Link
                href={`/espacos/${space.id}`}
                className="block h-full rounded-2xl border border-zinc-200 bg-white p-5 hover:border-teal-200"
              >
                <p className="text-base font-semibold text-zinc-900">
                  {space.name}
                </p>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-zinc-500">
                  {space.description || "Sem descrição."}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
