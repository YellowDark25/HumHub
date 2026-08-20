"use client";

import type { NotificationPreferences } from "@/domain/NotificationPreferences";
import type { Space } from "@/domain/Space";
import { NEW_CONTENT_SPACES_LABEL } from "@/shared/notificationSettings";
import { useEffect, useState, type FormEvent } from "react";
import {
  AccountFeedback,
  AccountSubmit,
} from "./AccountField";
import { AccountSpacePicker } from "./AccountSpacePicker";
import { useAccountForm } from "./useAccountForm";

type ChannelState = Record<string, { web: boolean; email: boolean }>;

type AccountNotificationSettingsProps = {
  spaces: Space[];
  preferences: NotificationPreferences;
};

export function AccountNotificationSettings({
  spaces,
  preferences,
}: AccountNotificationSettingsProps) {
  const { error, success, isSubmitting, submit } = useAccountForm();
  const [selectedSpaces, setSelectedSpaces] = useState<Space[]>(() =>
    selectedFromPreferences(spaces, preferences),
  );
  const [categories, setCategories] = useState(preferences.categories);
  const [channels, setChannels] = useState<ChannelState>(() =>
    channelsFromPreferences(preferences),
  );

  useEffect(() => {
    setSelectedSpaces(selectedFromPreferences(spaces, preferences));
    setCategories(preferences.categories);
    setChannels(channelsFromPreferences(preferences));
  }, [preferences, spaces]);

  function toggle(categoryId: string, target: "web" | "email") {
    setChannels((current) => ({
      ...current,
      [categoryId]: {
        ...current[categoryId],
        [target]: !current[categoryId][target],
      },
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submit({
      url: "/api/account/notifications",
      body: {
        spaceIds: selectedSpaces.map((space) => space.id),
        channels,
      },
      successMessage: "Configurações de notificação salvas.",
      fallbackError: "Não foi possível salvar as notificações.",
    });
  }

  async function handleReset() {
    const confirmed = window.confirm(
      "Deseja redefinir as configurações relativas às notificações?",
    );
    if (!confirmed) {
      return;
    }

    await submit({
      url: "/api/account/notifications/reset",
      method: "POST",
      successMessage: "Notificações redefinidas para o padrão.",
      fallbackError: "Não foi possível redefinir as notificações.",
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div>
        <p className="mb-2 text-sm font-medium text-zinc-800">
          {NEW_CONTENT_SPACES_LABEL}
        </p>
        <AccountSpacePicker
          spaces={spaces}
          selected={selectedSpaces}
          onChange={setSelectedSpaces}
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[32rem] text-left">
          <thead>
            <tr className="border-b border-zinc-200 text-xs font-medium tracking-wide text-zinc-500 uppercase">
              <th className="py-2 pr-4 font-medium">
                <span className="sr-only">Categoria</span>
              </th>
              <th className="w-16 py-2 text-center font-medium">Site</th>
              <th className="w-16 py-2 text-center font-medium">E-mail</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.id} className="border-b border-zinc-100">
                <td className="py-4 pr-4">
                  <p className="text-sm font-semibold text-zinc-900">
                    {category.title}
                  </p>
                  <p className="mt-1 text-sm leading-5 text-zinc-500">
                    {category.description}
                  </p>
                </td>
                <td className="py-4 text-center">
                  <input
                    type="checkbox"
                    checked={channels[category.id]?.web ?? category.web}
                    disabled={!category.webEditable}
                    onChange={() => toggle(category.id, "web")}
                    aria-label={`${category.title} no site`}
                    className="h-4 w-4 accent-teal-600 disabled:opacity-40"
                  />
                </td>
                <td className="py-4 text-center">
                  <input
                    type="checkbox"
                    checked={channels[category.id]?.email ?? category.email}
                    disabled={!category.emailEditable}
                    onChange={() => toggle(category.id, "email")}
                    aria-label={`${category.title} por e-mail`}
                    className="h-4 w-4 accent-teal-600 disabled:opacity-40"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <AccountFeedback error={error} success={success} />
      <div className="flex flex-wrap items-center gap-3">
        <AccountSubmit
          disabled={isSubmitting}
          label="Salvar"
          pendingLabel="Salvando…"
        />
        <button
          type="button"
          onClick={handleReset}
          disabled={isSubmitting}
          className="h-11 rounded-xl px-4 text-sm font-medium text-zinc-600 hover:bg-zinc-100 disabled:opacity-60"
        >
          Redefinir para valores padrão
        </button>
      </div>
    </form>
  );
}

function selectedFromPreferences(
  spaces: Space[],
  preferences: NotificationPreferences,
) {
  const selectedIds = new Set(preferences.spaceIds);
  return spaces.filter((space) => selectedIds.has(space.id));
}

function channelsFromPreferences(preferences: NotificationPreferences) {
  return Object.fromEntries(
    preferences.categories.map((category) => [
      category.id,
      { web: category.web, email: category.email },
    ]),
  );
}
