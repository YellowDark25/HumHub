import { errorMessage } from "@/application/errors";
import { Avatar } from "@/components/Avatar";
import { LoadError } from "@/components/LoadError";
import type { User } from "@/domain/User";
import { app } from "@/infrastructure/composition";
import {
  redirectIfUnauthorized,
  requirePageToken,
} from "@/infrastructure/pageSession";

export default async function PessoasPage() {
  const token = await requirePageToken();

  let people: User[] = [];
  let loadError = "";

  try {
    people = await app.listPeople(token);
  } catch (error) {
    await redirectIfUnauthorized(error);
    loadError = errorMessage(error, "Não foi possível carregar as pessoas.");
  }

  return (
    <main>
      <h1 className="text-2xl font-semibold text-zinc-900">Pessoas</h1>
      <p className="mt-1 mb-6 text-sm text-zinc-500">
        Quem participa dos espaços da intranet.
      </p>
      {loadError ? <LoadError message={loadError} /> : null}
      {people.length === 0 && !loadError ? (
        <p className="text-sm text-zinc-500">Nenhuma pessoa encontrada.</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {people.map((person) => (
            <li
              key={person.id}
              className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-4"
            >
              <Avatar name={person.name} imageUrl={person.imageUrl} />
              <p className="font-medium text-zinc-900">{person.name}</p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
