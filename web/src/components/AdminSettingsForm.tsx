"use client";

import type { AdminSettings } from "@/domain/AdminSettings";
import { useState } from "react";
import {
  AccountCheckbox,
  AccountField,
  AccountFeedback,
  AccountSelect,
  AccountSubmit,
} from "./AccountField";
import { useAccountForm } from "./useAccountForm";

type AdminSettingsFormProps = {
  settings: AdminSettings;
};

export function AdminSettingsForm({ settings }: AdminSettingsFormProps) {
  const { error, success, isSubmitting, submit } = useAccountForm();
  const [name, setName] = useState(settings.name);
  const [baseUrl, setBaseUrl] = useState(settings.baseUrl);
  const [defaultLanguage, setDefaultLanguage] = useState(settings.defaultLanguage);
  const [timeZone, setTimeZone] = useState(settings.timeZone);
  const [maintenanceMode, setMaintenanceMode] = useState(settings.maintenanceMode);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submit({
      url: "/api/admin/settings",
      method: "PUT",
      body: {
        name,
        baseUrl,
        defaultLanguage,
        timeZone,
        maintenanceMode,
      },
      successMessage: "Configurações salvas.",
      fallbackError: "Não foi possível salvar as configurações.",
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-xl flex-col gap-4">
      <AccountField
        label="Nome da rede"
        name="name"
        value={name}
        required
        onChange={setName}
      />
      <AccountField
        label="URL base"
        name="baseUrl"
        value={baseUrl}
        required
        onChange={setBaseUrl}
      />
      <AccountSelect
        label="Idioma padrão"
        name="defaultLanguage"
        value={defaultLanguage}
        options={settings.languages}
        onChange={setDefaultLanguage}
      />
      <AccountSelect
        label="Fuso horário"
        name="timeZone"
        value={timeZone}
        options={settings.timeZones}
        onChange={setTimeZone}
      />
      <AccountCheckbox
        label="Modo de manutenção"
        name="maintenanceMode"
        checked={maintenanceMode}
        onChange={setMaintenanceMode}
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
