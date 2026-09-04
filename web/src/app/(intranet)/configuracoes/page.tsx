import { errorMessage, isUnauthorized } from "@/application/errors";
import { AccountDeleteForm } from "@/components/AccountDeleteForm";
import { AccountDigestSettings } from "@/components/AccountDigestSettings";
import { AccountEmailForm } from "@/components/AccountEmailForm";
import { AccountGeneralForm } from "@/components/AccountGeneralForm";
import { AccountGoogleConnect } from "@/components/AccountGoogleConnect";
import { AccountModulesSettings } from "@/components/AccountModulesSettings";
import { AccountNotificationSettings } from "@/components/AccountNotificationSettings";
import { AccountPanel, AccountProfileTabs } from "@/components/AccountPanel";
import { AccountPasswordForm } from "@/components/AccountPasswordForm";
import { AccountProfileForm } from "@/components/AccountProfileForm";
import { AccountSidebar } from "@/components/AccountSidebar";
import { AccountUsernameForm } from "@/components/AccountUsernameForm";
import { LoadError } from "@/components/LoadError";
import type { Account } from "@/domain/Account";
import type { AccountGeneralSettings } from "@/domain/AccountGeneralSettings";
import type { GoogleAccountStatus } from "@/domain/GoogleAccount";
import type { AccountProfileModule } from "@/domain/AccountProfileModule";
import type { NotificationPreferences } from "@/domain/NotificationPreferences";
import type { Space } from "@/domain/Space";
import type { User } from "@/domain/User";
import { app } from "@/infrastructure/composition";
import {
  redirectIfUnauthorized,
  requirePageToken,
} from "@/infrastructure/pageSession";
import {
  ACCOUNT_GENERAL_DESCRIPTION,
  ACCOUNT_GENERAL_TITLE,
  ACCOUNT_MODULES_DESCRIPTION,
  ACCOUNT_MODULES_TITLE,
} from "@/shared/accountProfileFields";
import {
  NOTIFICATION_SETTINGS_DESCRIPTION,
  NOTIFICATION_SETTINGS_TITLE,
} from "@/shared/notificationSettings";
import {
  readAccountProfileTab,
  readAccountSection,
  type AccountProfileTabId,
  type AccountSectionId,
} from "@/shared/accountSection";
import { Suspense } from "react";

/**
 * Página de configurações da conta.
 * Lê a seção da URL, carrega os dados pelo token e renderiza o painel correspondente.
 * Falha do vínculo Google não derruba as outras seções.
 */
export default async function ConfiguracoesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const token = await requirePageToken();
  const params = await searchParams;
  const section = readAccountSection(params);
  const tab = readAccountProfileTab(params);

  let account: Account | null = null;
  let spaces: Space[] = [];
  let preferences: NotificationPreferences | null = null;
  let generalSettings: AccountGeneralSettings | null = null;
  let people: User[] = [];
  let profileModules: AccountProfileModule[] | null = null;
  let googleAccount: GoogleAccountStatus | null = null;
  let loadError = "";

  try {
    account = await app.getAccount(token);
    if (section === "notificacoes") {
      const loaded = await loadNotificationPage(token);
      spaces = loaded.spaces;
      preferences = loaded.preferences;
    }
    if (section === "geral") {
      const loaded = await loadGeneralPage(token);
      generalSettings = loaded.settings;
      people = loaded.people;
    }
    if (section === "modulos") {
      profileModules = await app.listAccountModules(token);
    }
    if (section === "integracoes") {
      googleAccount = await loadGoogleAccount(token);
    }
  } catch (error) {
    await redirectIfUnauthorized(error);
    loadError = errorMessage(
      error,
      "Não foi possível carregar as configurações.",
    );
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
      <AccountSidebar section={section} />
      <main className="min-w-0">
        {loadError ? <LoadError message={loadError} /> : null}
        {account ? (
          <AccountContent
            account={account}
            spaces={spaces}
            preferences={preferences}
            generalSettings={generalSettings}
            people={people}
            profileModules={profileModules}
            googleAccount={googleAccount}
            section={section}
            tab={tab}
          />
        ) : null}
      </main>
    </div>
  );
}

function AccountContent({
  account,
  spaces,
  preferences,
  generalSettings,
  people,
  profileModules,
  googleAccount,
  section,
  tab,
}: {
  account: Account;
  spaces: Space[];
  preferences: NotificationPreferences | null;
  generalSettings: AccountGeneralSettings | null;
  people: User[];
  profileModules: AccountProfileModule[] | null;
  googleAccount: GoogleAccountStatus | null;
  section: AccountSectionId;
  tab: AccountProfileTabId;
}) {
  if (section === "emails") {
    return (
      <AccountPanel
        title="E-mails de resumo"
        description="Escolha com que frequência deseja receber um resumo das atividades."
      >
        <AccountDigestSettings />
      </AccountPanel>
    );
  }

  if (section === "notificacoes") {
    return (
      <AccountPanel
        title={NOTIFICATION_SETTINGS_TITLE}
        description={NOTIFICATION_SETTINGS_DESCRIPTION}
      >
        {preferences ? (
          <AccountNotificationSettings
            spaces={spaces}
            preferences={preferences}
          />
        ) : (
          <LoadError message="Não foi possível carregar as configurações de notificação." />
        )}
      </AccountPanel>
    );
  }

  if (section === "geral") {
    return (
      <AccountPanel
        title={ACCOUNT_GENERAL_TITLE}
        description={ACCOUNT_GENERAL_DESCRIPTION}
      >
        {generalSettings ? (
          <AccountGeneralForm settings={generalSettings} people={people} />
        ) : (
          <LoadError message="Não foi possível carregar as configurações gerais." />
        )}
      </AccountPanel>
    );
  }

  if (section === "integracoes") {
    return (
      <AccountPanel
        title="Integrações"
        description="Conecte o Google para a secretária cuidar da agenda e das tarefas."
      >
        {googleAccount ? (
          <Suspense fallback={<p className="text-sm text-zinc-500">Carregando…</p>}>
            <AccountGoogleConnect status={googleAccount} />
          </Suspense>
        ) : (
          <LoadError message="Não foi possível carregar o vínculo Google." />
        )}
      </AccountPanel>
    );
  }

  if (section === "modulos") {
    return (
      <AccountPanel
        title={ACCOUNT_MODULES_TITLE}
        description={ACCOUNT_MODULES_DESCRIPTION}
      >
        {profileModules ? (
          <AccountModulesSettings modules={profileModules} />
        ) : (
          <LoadError message="Não foi possível carregar os módulos." />
        )}
      </AccountPanel>
    );
  }

  return (
    <AccountPanel title="Seu perfil">
      <AccountProfileTabs tab={tab} />
      <ProfileTab account={account} tab={tab} />
    </AccountPanel>
  );
}

function ProfileTab({
  account,
  tab,
}: {
  account: Account;
  tab: AccountProfileTabId;
}) {
  if (tab === "usuario") {
    return <AccountUsernameForm account={account} />;
  }

  if (tab === "email") {
    return <AccountEmailForm account={account} />;
  }

  if (tab === "senha") {
    return <AccountPasswordForm />;
  }

  if (tab === "apagar") {
    return <AccountDeleteForm />;
  }

  return <AccountProfileForm account={account} />;
}

async function loadNotificationPage(token: string) {
  const [spaces, preferences] = await Promise.all([
    app.listSpaces(token),
    app.getNotificationPreferences(token),
  ]);

  return { spaces, preferences };
}

async function loadGeneralPage(token: string) {
  const settings = await app.getAccountGeneralSettings(token);
  const people = settings.showBlockedUsers
    ? await app.listPeople(token)
    : [];

  return { settings, people };
}

/**
 * Lê o vínculo Google sem derrubar o restante das configurações.
 * 404 ou falha do HumHub vira "desconectado"; 401 sobe para o redirect.
 */
async function loadGoogleAccount(token: string): Promise<GoogleAccountStatus> {
  try {
    return await app.getGoogleAccountStatus(token);
  } catch (error) {
    if (isUnauthorized(error)) {
      throw error;
    }

    console.error("Falha ao ler vínculo Google:", error);
    return { connected: false, email: "" };
  }
}
