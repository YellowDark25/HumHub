"use client";

import type { Account } from "@/domain/Account";
import {
  ACCOUNT_LANGUAGES,
  ACCOUNT_TIME_ZONES,
  ACCOUNT_VISIBILITY_OPTIONS,
} from "@/shared/accountProfileFields";
import { useState, type FormEvent } from "react";
import {
  AccountFeedback,
  AccountField,
  AccountSelect,
  AccountSubmit,
} from "./AccountField";
import { useAccountForm } from "./useAccountForm";

export function AccountGeneralForm({ account }: { account: Account }) {
  const { error, success, isSubmitting, submit } = useAccountForm();
  const [tags, setTags] = useState(account.tags.join(", "));
  const [language, setLanguage] = useState(account.language);
  const [timeZone, setTimeZone] = useState(account.timeZone);
  const languages = withCurrentOption(ACCOUNT_LANGUAGES, account.language);
  const timeZones = withCurrentOption(ACCOUNT_TIME_ZONES, account.timeZone);
  const [visibility, setVisibility] = useState(String(account.visibility));

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submit({
      url: "/api/account/general",
      body: {
        tags,
        language,
        timeZone,
        visibility: Number(visibility),
      },
      successMessage: "Configurações salvas.",
      fallbackError: "Não foi possível salvar as configurações.",
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-lg flex-col gap-4">
      <AccountField
        label="Tags"
        name="tags"
        value={tags}
        onChange={setTags}
      />
      <AccountSelect
        label="Idioma"
        name="language"
        value={language}
        options={languages}
        onChange={setLanguage}
      />
      <AccountSelect
        label="Fuso horário"
        name="timeZone"
        value={timeZone}
        options={timeZones}
        onChange={setTimeZone}
      />
      <AccountSelect
        label="Visibilidade"
        name="visibility"
        value={visibility}
        options={ACCOUNT_VISIBILITY_OPTIONS.map((option) => ({
          value: String(option.value),
          label: option.label,
        }))}
        onChange={setVisibility}
      />
      <AccountFeedback error={error} success={success} />
      <AccountSubmit
        disabled={isSubmitting}
        label="Salvar"
        pendingLabel="Salvando…"
      />
    </form>
  );
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
