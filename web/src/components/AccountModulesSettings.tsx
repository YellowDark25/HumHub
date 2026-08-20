"use client";

import type { AccountProfileModule } from "@/domain/AccountProfileModule";
import { useEffect, useState } from "react";
import { AccountFeedback } from "./AccountField";
import { useAccountForm } from "./useAccountForm";

type AccountModulesSettingsProps = {
  modules: AccountProfileModule[];
};

export function AccountModulesSettings({
  modules: initialModules,
}: AccountModulesSettingsProps) {
  const { error, success, isSubmitting, submit } = useAccountForm();
  const [modules, setModules] = useState(initialModules);
  const [pendingId, setPendingId] = useState("");

  useEffect(() => {
    setModules(initialModules);
  }, [initialModules]);

  async function enable(module: AccountProfileModule) {
    setPendingId(module.id);
    await submit({
      url: "/api/account/modules/enable",
      method: "POST",
      body: { moduleId: module.id },
      successMessage: `${module.name} habilitado.`,
      fallbackError: "Não foi possível habilitar o módulo.",
    });
    setPendingId("");
  }

  async function disable(module: AccountProfileModule) {
    const confirmed = window.confirm(
      `Desativar o módulo ${module.name} apagará permanentemente todo o conteúdo relacionado a ele no seu perfil.`,
    );
    if (!confirmed) {
      return;
    }

    setPendingId(module.id);
    await submit({
      url: "/api/account/modules/disable",
      method: "POST",
      body: { moduleId: module.id },
      successMessage: `${module.name} desativado.`,
      fallbackError: "Não foi possível desativar o módulo.",
    });
    setPendingId("");
  }

  if (modules.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-6 text-sm text-zinc-500">
        Nenhum módulo disponível para a sua conta.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <AccountFeedback error={error} success={success} />
      <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200">
        {modules.map((module) => (
          <li
            key={module.id}
            className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex min-w-0 items-start gap-3">
              <ModuleIcon name={module.name} imageUrl={module.imageUrl} />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-zinc-900">
                  {module.name}
                  {module.version ? (
                    <span className="ml-2 font-normal text-zinc-400">
                      Versão {module.version}
                    </span>
                  ) : null}
                </p>
                <p className="mt-1 text-sm leading-5 text-zinc-500">
                  {module.description}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
              {module.isEnabled && module.configUrl ? (
                <a
                  href={module.configUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="h-9 rounded-lg border border-zinc-200 px-3 text-sm font-medium leading-9 text-zinc-700 hover:bg-zinc-50"
                >
                  Configurar
                </a>
              ) : null}
              {module.isEnabled && module.canDisable ? (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => disable(module)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-teal-600 px-3 text-sm font-medium text-teal-700 disabled:opacity-60"
                >
                  <EnabledCheckIcon />
                  {pendingId === module.id ? "Desativando…" : "Ativado"}
                </button>
              ) : null}
              {module.isEnabled && !module.canDisable ? (
                <span className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-teal-600 px-3 text-sm font-medium text-teal-700">
                  <EnabledCheckIcon />
                  Ativado
                </span>
              ) : null}
              {module.canEnable ? (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => enable(module)}
                  className="h-9 rounded-lg bg-teal-700 px-3 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {pendingId === module.id ? "Habilitando…" : "Habilitar"}
                </button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ModuleIcon({ name, imageUrl }: { name: string; imageUrl: string }) {
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt=""
        className="h-9 w-9 rounded-lg object-cover"
      />
    );
  }

  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-100 text-sm font-semibold text-teal-800">
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

function EnabledCheckIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden="true">
      <path
        fill="currentColor"
        d="M6.2 11.2 3.4 8.4l1.1-1.1 1.7 1.7 5.3-5.3 1.1 1.1z"
      />
    </svg>
  );
}
