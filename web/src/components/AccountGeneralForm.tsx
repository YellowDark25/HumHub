"use client";

import type { AccountGeneralSettings } from "@/domain/AccountGeneralSettings";
import type { User } from "@/domain/User";
import {
  ACCOUNT_EDITOR_MODES,
  ACCOUNT_TAGS_HINT,
} from "@/shared/accountProfileFields";
import { useEffect, useState, type FormEvent } from "react";
import {
  AccountCheckbox,
  AccountFeedback,
  AccountSelect,
  AccountSubmit,
} from "./AccountField";
import { AccountTagPicker } from "./AccountTagPicker";
import { AccountUserPicker } from "./AccountUserPicker";
import { useAccountForm } from "./useAccountForm";

type AccountGeneralFormProps = {
  settings: AccountGeneralSettings;
  people: User[];
};

export function AccountGeneralForm({
  settings,
  people,
}: AccountGeneralFormProps) {
  const { error, success, isSubmitting, submit } = useAccountForm();
  const [tags, setTags] = useState(settings.tags);
  const [language, setLanguage] = useState(settings.language);
  const [timeZone, setTimeZone] = useState(settings.timeZone);
  const [visibility, setVisibility] = useState(String(settings.visibility));
  const [hideOnlineStatus, setHideOnlineStatus] = useState(
    settings.hideOnlineStatus,
  );
  const [hideTourPanel, setHideTourPanel] = useState(settings.hideTourPanel);
  const [markdownEditorMode, setMarkdownEditorMode] = useState(
    settings.markdownEditorMode,
  );
  const [blockedUsers, setBlockedUsers] = useState(() =>
    selectedBlockedUsers(people, settings),
  );

  useEffect(() => {
    setTags(settings.tags);
    setLanguage(settings.language);
    setTimeZone(settings.timeZone);
    setVisibility(String(settings.visibility));
    setHideOnlineStatus(settings.hideOnlineStatus);
    setHideTourPanel(settings.hideTourPanel);
    setMarkdownEditorMode(settings.markdownEditorMode);
    setBlockedUsers(selectedBlockedUsers(people, settings));
  }, [people, settings]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submit({
      url: "/api/account/general",
      body: {
        tags,
        language,
        timeZone,
        visibility: Number(visibility),
        hideOnlineStatus,
        hideTourPanel,
        markdownEditorMode,
        blockedUserIds: blockedUsers.map((user) => user.id),
      },
      successMessage: "Configurações salvas.",
      fallbackError: "Não foi possível salvar as configurações.",
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-xl flex-col gap-5">
      <div>
        <AccountTagPicker tags={tags} onChange={setTags} />
        <p className="mt-2 text-xs leading-5 text-zinc-500">{ACCOUNT_TAGS_HINT}</p>
      </div>
      <AccountSelect
        label="Idioma"
        name="language"
        value={language}
        options={withCurrentOption(settings.languages, language)}
        onChange={setLanguage}
      />
      <AccountSelect
        label="Fuso horário"
        name="timeZone"
        value={timeZone}
        options={withCurrentOption(settings.timeZones, timeZone)}
        onChange={setTimeZone}
      />
      {settings.showVisibility ? (
        <AccountSelect
          label="Visibilidade"
          name="visibility"
          value={visibility}
          options={settings.visibilityOptions}
          disabled={!settings.visibilityEditable}
          onChange={setVisibility}
        />
      ) : null}
      {settings.showOnlineStatus ? (
        <AccountCheckbox
          label="Ocultar meu status online"
          name="hideOnlineStatus"
          checked={hideOnlineStatus}
          onChange={setHideOnlineStatus}
        />
      ) : null}
      {settings.showTourPanel ? (
        <AccountCheckbox
          label="Ocultar painel de introdução do tour no painel"
          name="hideTourPanel"
          checked={hideTourPanel}
          onChange={setHideTourPanel}
        />
      ) : null}
      <AccountSelect
        label="Modo de editor Markdown"
        name="markdownEditorMode"
        value={markdownEditorMode}
        options={editorModeOptions(settings)}
        onChange={(value) =>
          setMarkdownEditorMode(value === "plain" ? "plain" : "rich")
        }
      />
      {settings.showBlockedUsers ? (
        <AccountUserPicker
          label="Usuários bloqueados"
          users={people}
          selected={blockedUsers}
          onChange={setBlockedUsers}
        />
      ) : null}
      <AccountFeedback error={error} success={success} />
      <AccountSubmit
        disabled={isSubmitting}
        label="Salvar"
        pendingLabel="Salvando…"
      />
    </form>
  );
}

function editorModeOptions(settings: AccountGeneralSettings) {
  const rich = settings.editorModes.find((option) => option.value === "0");
  const plain = settings.editorModes.find((option) => option.value === "1");

  return ACCOUNT_EDITOR_MODES.map((mode) => ({
    value: mode.value,
    label:
      mode.value === "rich"
        ? rich?.label || mode.label
        : plain?.label || mode.label,
  }));
}

function selectedBlockedUsers(
  people: User[],
  settings: AccountGeneralSettings,
) {
  const selectedIds = new Set(settings.blockedUsers.map((user) => user.id));
  const fromPeople = people.filter((user) => selectedIds.has(user.id));
  const missing = settings.blockedUsers.filter(
    (blocked) => !fromPeople.some((user) => user.id === blocked.id),
  );

  return [...fromPeople, ...missing];
}

function withCurrentOption(
  options: readonly { value: string; label: string }[],
  current: string,
) {
  if (!current || options.some((option) => option.value === current)) {
    return options;
  }

  return [{ value: current, label: current }, ...options];
}
