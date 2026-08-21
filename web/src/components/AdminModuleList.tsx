"use client";

import type { AdminModule } from "@/domain/AdminModule";
import { useState } from "react";
import { AccountFeedback } from "./AccountField";
import { useAccountForm } from "./useAccountForm";

type AdminModuleListProps = {
  modules: AdminModule[];
};

export function AdminModuleList({ modules }: AdminModuleListProps) {
  const { error, success, isSubmitting, submit } = useAccountForm();
  const [pendingId, setPendingId] = useState("");

  async function enable(module: AdminModule) {
    setPendingId(module.id);
    await submit({
      url: "/api/admin/modules/enable",
      method: "POST",
      body: { moduleId: module.id },
      successMessage: `${module.name} habilitado.`,
      fallbackError: "Não foi possível habilitar o módulo.",
    });
    setPendingId("");
  }

  async function disable(module: AdminModule) {
    const confirmed = window.confirm(
      `Desativar o módulo ${module.name} pode apagar conteúdo criado com ele. Continuar?`,
    );
    if (!confirmed) {
      return;
    }

    setPendingId(module.id);
    await submit({
      url: "/api/admin/modules/disable",
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
        Nenhum módulo instalado ainda. Instale alguns para melhorar a funcionalidade!
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
            <div className="min-w-0">
              <p className="text-sm font-semibold text-zinc-900">
                {module.name}
                {module.version ? (
                  <span className="ml-2 font-normal text-zinc-400">
                    Versão {module.version}
                  </span>
                ) : null}
              </p>
              {module.description ? (
                <p className="mt-1 text-sm leading-6 text-zinc-500">
                  {module.description}
                </p>
              ) : null}
              <p className="mt-1 text-xs font-medium text-zinc-400">
                {module.isEnabled ? "Ativo" : "Inativo"}
              </p>
            </div>
            <ModuleAction
              module={module}
              pending={isSubmitting && pendingId === module.id}
              onEnable={() => enable(module)}
              onDisable={() => disable(module)}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

function ModuleAction({
  module,
  pending,
  onEnable,
  onDisable,
}: {
  module: AdminModule;
  pending: boolean;
  onEnable: () => void;
  onDisable: () => void;
}) {
  if (module.canDisable) {
    return (
      <button
        type="button"
        disabled={pending}
        onClick={onDisable}
        className="h-10 shrink-0 rounded-xl border border-zinc-200 px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
      >
        {pending ? "Desativando…" : "Desativar"}
      </button>
    );
  }

  if (module.canEnable) {
    return (
      <button
        type="button"
        disabled={pending}
        onClick={onEnable}
        className="h-10 shrink-0 rounded-xl bg-teal-700 px-4 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? "Habilitando…" : "Habilitar"}
      </button>
    );
  }

  return null;
}
