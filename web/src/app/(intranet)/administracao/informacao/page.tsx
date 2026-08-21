import { errorMessage } from "@/application/errors";
import { AdminNote, AdminPanel, AdminTabs } from "@/components/AdminPanel";
import { LoadError } from "@/components/LoadError";
import type { AdminInformation } from "@/domain/AdminInformation";
import { app } from "@/infrastructure/composition";
import { APP_NAME } from "@/shared/appName";
import {
  redirectIfUnauthorized,
  requirePageToken,
} from "@/infrastructure/pageSession";
import {
  ADMIN_INFO_TABS,
  adminInfoTabHref,
  readAdminInfoTab,
  type AdminInfoTabId,
} from "@/shared/adminSection";

export default async function AdminInformacaoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const token = await requirePageToken();
  const tab = readAdminInfoTab(await searchParams);

  let information: AdminInformation | null = null;
  let loadError = "";

  try {
    information = await app.getAdminInformation(token);
  } catch (error) {
    await redirectIfUnauthorized(error);
    loadError = errorMessage(
      error,
      "Não foi possível carregar as informações do sistema.",
    );
  }

  return (
    <main>
      <AdminPanel title="Informação" description={`Status e diagnóstico do ${APP_NAME}.`}>
        <AdminTabs
          items={ADMIN_INFO_TABS}
          activeId={tab}
          hrefFor={adminInfoTabHref}
        />
        {loadError ? (
          <LoadError message={loadError} />
        ) : (
          <InfoTabContent tab={tab} information={information} />
        )}
      </AdminPanel>
    </main>
  );
}

function InfoTabContent({
  tab,
  information,
}: {
  tab: AdminInfoTabId;
  information: AdminInformation | null;
}) {
  if (!information) {
    return <LoadError message="Não foi possível carregar as informações do sistema." />;
  }

  if (tab === "pre-requisitos") {
    return (
      <AdminNote>
        Verifique os pré-requisitos de software da instalação, inclusive a
        versão do PHP ({information.phpVersion}).
      </AdminNote>
    );
  }

  if (tab === "banco") {
    return (
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <InfoItem label="Driver" value={information.databaseDriver} />
        <InfoItem label="Banco de dados" value={information.databaseName} />
      </dl>
    );
  }

  if (tab === "tarefas") {
    return (
      <AdminNote>
        Consulte a documentação para configurar os cronjobs e os trabalhadores
        da fila. Sem isso, notificações e tarefas em segundo plano podem
        atrasar.
      </AdminNote>
    );
  }

  if (tab === "logs") {
    return (
      <AdminNote>
        Os registros de log do sistema ficam no HumHub. Use esta área para
        acompanhar erros e avisos da instalação.
      </AdminNote>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {information.isDebug ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          O sistema está em modo debug. Desabilite isso em produção.
        </p>
      ) : (
        <p className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-800">
          Esta instalação do {APP_NAME} está atualizada!
        </p>
      )}
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <InfoItem label="Nome" value={information.appName} />
        <InfoItem label="Versão" value={information.version} />
        <InfoItem label="PHP" value={information.phpVersion} />
        <InfoItem label="URL base" value={information.baseUrl} />
      </dl>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 px-4 py-3">
      <dt className="text-xs font-medium tracking-wide text-zinc-400 uppercase">
        {label}
      </dt>
      <dd className="mt-1 font-medium text-zinc-900">{value || "—"}</dd>
    </div>
  );
}
