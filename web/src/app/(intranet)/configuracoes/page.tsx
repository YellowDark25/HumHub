import { errorMessage } from "@/application/errors";
import { AccountDeleteForm } from "@/components/AccountDeleteForm";
import { AccountDigestSettings } from "@/components/AccountDigestSettings";
import { AccountEmailForm } from "@/components/AccountEmailForm";
import { AccountGeneralForm } from "@/components/AccountGeneralForm";
import { AccountModulesSettings } from "@/components/AccountModulesSettings";
import { AccountNotificationSettings } from "@/components/AccountNotificationSettings";
import { AccountPanel, AccountProfileTabs } from "@/components/AccountPanel";
import { AccountPasswordForm } from "@/components/AccountPasswordForm";
import { AccountProfileForm } from "@/components/AccountProfileForm";
import { AccountSidebar } from "@/components/AccountSidebar";
import { AccountUsernameForm } from "@/components/AccountUsernameForm";
import { LoadError } from "@/components/LoadError";
import type { Account } from "@/domain/Account";
import type { NotificationPreferences } from "@/domain/NotificationPreferences";
import type { Space } from "@/domain/Space";
import { app } from "@/infrastructure/composition";
import {
  redirectIfUnauthorized,
  requirePageToken,
} from "@/infrastructure/pageSession";
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
  let loadError = "";

  try {
    account = await app.getAccount(token);
    if (section === "notificacoes") {
      const loaded = await loadNotificationPage(token);
      spaces = loaded.spaces;
      preferences = loaded.preferences;
    }
  } catch (error) {
    await redirectIfUnauthorized(error);
    loadError = errorMessage(
      error,
      "Não foi possível carregar as configurações.",
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
      <AccountSidebar section={section} />
      <main className="min-w-0">
        {loadError ? <LoadError message={loadError} /> : null}
        {account ? (
          <AccountContent
            account={account}
            spaces={spaces}
            preferences={preferences}
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
  section,
  tab,
}: {
  account: Account;
  spaces: Space[];
  preferences: NotificationPreferences | null;
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
      <AccountPanel title="Geral">
        <AccountGeneralForm account={account} />
      </AccountPanel>
    );
  }

  if (section === "modulos") {
    return (
      <AccountPanel title="Módulos">
        <AccountModulesSettings />
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
