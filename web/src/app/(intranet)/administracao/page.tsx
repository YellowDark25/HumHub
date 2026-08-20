import { errorMessage, isForbidden } from "@/application/errors";
import { LoadError } from "@/components/LoadError";
import { app } from "@/infrastructure/composition";
import { APP_NAME } from "@/shared/appName";
import {
  redirectIfUnauthorized,
  requirePageToken,
} from "@/infrastructure/pageSession";
import Link from "next/link";

const ADMIN_LINKS = [
  {
    href: "/pessoas",
    title: "Pessoas",
    description: `Quem participa dos espaços do ${APP_NAME}.`,
  },
  {
    href: "/espacos",
    title: "Espaços",
    description: "Espaços de trabalho e comunidades.",
  },
];

export default async function AdministracaoPage() {
  const token = await requirePageToken();

  let loadError = "";

  try {
    await app.requireAdminAccess(token);
  } catch (error) {
    await redirectIfUnauthorized(error);
    loadError = isForbidden(error)
      ? errorMessage(error, "Você não tem permissão para acessar esta área.")
      : errorMessage(error, "Não foi possível abrir a administração.");
  }

  return (
    <main>
      <h1 className="text-2xl font-semibold text-zinc-900">Administração</h1>
      <p className="mt-1 mb-6 text-sm text-zinc-500">
        Gestão do {APP_NAME}: pessoas, espaços e configurações do sistema.
      </p>
      {loadError ? (
        <LoadError message={loadError} />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {ADMIN_LINKS.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="block h-full rounded-2xl border border-zinc-200 bg-white p-5 hover:border-teal-200"
              >
                <p className="text-base font-semibold text-zinc-900">
                  {item.title}
                </p>
                <p className="mt-2 text-sm leading-6 text-zinc-500">
                  {item.description}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
