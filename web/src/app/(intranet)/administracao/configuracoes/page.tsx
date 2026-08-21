import { errorMessage } from "@/application/errors";
import { AdminNote, AdminPanel, AdminTabs } from "@/components/AdminPanel";
import { AdminSettingsForm } from "@/components/AdminSettingsForm";
import { LoadError } from "@/components/LoadError";
import type { AdminSettings } from "@/domain/AdminSettings";
import { app } from "@/infrastructure/composition";
import {
  redirectIfUnauthorized,
  requirePageToken,
} from "@/infrastructure/pageSession";
import {
  ADMIN_SETTING_TABS,
  adminSettingTabHref,
  readAdminSettingTab,
  type AdminSettingTabId,
} from "@/shared/adminSection";

export default async function AdminConfiguracoesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const token = await requirePageToken();
  const tab = readAdminSettingTab(await searchParams);

  let settings: AdminSettings | null = null;
  let loadError = "";

  try {
    if (tab === "geral") {
      settings = await app.getAdminSettings(token);
    }
  } catch (error) {
    await redirectIfUnauthorized(error);
    loadError = errorMessage(
      error,
      "Não foi possível carregar as configurações.",
    );
  }

  return (
    <main>
      <AdminPanel title="Configurações" description={settingTabDescription(tab)}>
        <AdminTabs
          items={ADMIN_SETTING_TABS}
          activeId={tab}
          hrefFor={adminSettingTabHref}
        />
        {loadError ? <LoadError message={loadError} /> : (
          <SettingTabContent tab={tab} settings={settings} />
        )}
      </AdminPanel>
    </main>
  );
}

function SettingTabContent({
  tab,
  settings,
}: {
  tab: AdminSettingTabId;
  settings: AdminSettings | null;
}) {
  if (tab === "aparencia") {
    return (
      <AdminNote>
        Tema, logotipo e demais opções visuais da intranet. Essas definições
        valem para todos os usuários.
      </AdminNote>
    );
  }

  if (tab === "notificacoes") {
    return (
      <AdminNote>
        Preferências padrão de notificação da rede. Cada pessoa ainda pode
        ajustar as próprias opções em Configurações.
      </AdminNote>
    );
  }

  if (tab === "topicos") {
    return (
      <AdminNote>
        Tópicos globais usados para organizar publicações nos espaços e nos
        perfis.
      </AdminNote>
    );
  }

  if (tab === "avancado") {
    return (
      <AdminNote>
        Cache, e-mail, arquivos, proxy e outras opções avançadas da instalação.
      </AdminNote>
    );
  }

  if (!settings) {
    return <LoadError message="Não foi possível carregar as configurações gerais." />;
  }

  return <AdminSettingsForm settings={settings} />;
}

function settingTabDescription(tab: AdminSettingTabId) {
  if (tab === "geral") {
    return "Nome da rede, URL base, idioma padrão e modo de manutenção.";
  }

  return "Ajustes do sistema aplicados a toda a intranet.";
}
