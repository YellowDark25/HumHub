import { errorMessage } from "@/application/errors";
import { LoadError } from "@/components/LoadError";
import { PeopleDirectory } from "@/components/PeopleDirectory";
import type { Person } from "@/domain/Person";
import { app } from "@/infrastructure/composition";
import { APP_NAME } from "@/shared/appName";
import {
  redirectIfUnauthorized,
  requirePageToken,
} from "@/infrastructure/pageSession";

export default async function PessoasPage() {
  const token = await requirePageToken();

  let people: Person[] = [];
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
        Quem participa dos espaços do {APP_NAME}. Siga para pedir amizade e,
        depois do aceite, conversar no chat.
      </p>
      {loadError ? <LoadError message={loadError} /> : null}
      {people.length === 0 && !loadError ? (
        <p className="text-sm text-zinc-500">Nenhuma pessoa encontrada.</p>
      ) : (
        <PeopleDirectory people={people} />
      )}
    </main>
  );
}
