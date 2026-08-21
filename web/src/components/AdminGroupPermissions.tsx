"use client";

import type {
  AdminGroupPermission,
  AdminGroupPermissionState,
} from "@/domain/AdminGroup";
import { readApiError } from "@/shared/readApiError";
import { useMemo, useState } from "react";

const STATE_OPTIONS: { id: AdminGroupPermissionState; label: string }[] = [
  { id: "default", label: "Padrão" },
  { id: "allow", label: "Permitir" },
  { id: "deny", label: "Negar" },
];

type AdminGroupPermissionsProps = {
  groupId: number;
  permissions: AdminGroupPermission[];
};

export function AdminGroupPermissions({
  groupId,
  permissions: initialPermissions,
}: AdminGroupPermissionsProps) {
  const [permissions, setPermissions] = useState(initialPermissions);
  const [error, setError] = useState("");
  const [pendingKey, setPendingKey] = useState("");
  const modules = useMemo(() => groupByModule(permissions), [permissions]);

  async function changeState(
    permission: AdminGroupPermission,
    state: AdminGroupPermissionState,
  ) {
    if (!permission.canChange || permission.state === state) {
      return;
    }

    setError("");
    const key = permissionKey(permission);
    setPendingKey(key);

    try {
      const response = await fetch(`/api/admin/groups/${groupId}/permissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          permissionId: permission.id,
          moduleId: permission.moduleId,
          state,
        }),
      });
      if (!response.ok) {
        setError(
          await readApiError(response, "Não foi possível atualizar a permissão."),
        );
        return;
      }

      const payload = (await response.json()) as {
        permissions: AdminGroupPermission[];
      };
      setPermissions(payload.permissions);
    } catch {
      setError("Falha de rede ao atualizar a permissão.");
    } finally {
      setPendingKey("");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm leading-6 text-zinc-500">
        Estas permissões valem para todos os membros do grupo. Use Padrão para
        seguir a configuração original do módulo.
      </p>
      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      {modules.map((module) => (
        <section key={module.name} className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-zinc-900">{module.name}</h2>
          <ul className="divide-y divide-zinc-100 rounded-xl border border-zinc-200">
            {module.permissions.map((permission) => (
              <li
                key={permissionKey(permission)}
                className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-900">
                    {permission.title}
                  </p>
                  {permission.description ? (
                    <p className="mt-1 text-sm leading-6 text-zinc-500">
                      {permission.description}
                    </p>
                  ) : null}
                </div>
                <select
                  aria-label={`Estado de ${permission.title}`}
                  value={permission.state}
                  disabled={!permission.canChange || pendingKey === permissionKey(permission)}
                  onChange={(event) =>
                    void changeState(
                      permission,
                      event.target.value as AdminGroupPermissionState,
                    )
                  }
                  className="h-10 shrink-0 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-800 outline-none focus:border-teal-600 disabled:bg-zinc-50 disabled:text-zinc-500"
                >
                  {STATE_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.id === "default"
                        ? permission.defaultLabel
                        : option.label}
                    </option>
                  ))}
                </select>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function groupByModule(permissions: AdminGroupPermission[]) {
  const modules: { name: string; permissions: AdminGroupPermission[] }[] = [];
  for (const permission of permissions) {
    const current = modules.find((module) => module.name === permission.moduleName);
    if (current) {
      current.permissions.push(permission);
      continue;
    }

    modules.push({ name: permission.moduleName, permissions: [permission] });
  }

  return modules;
}

function permissionKey(permission: AdminGroupPermission) {
  return `${permission.moduleId}:${permission.id}`;
}
