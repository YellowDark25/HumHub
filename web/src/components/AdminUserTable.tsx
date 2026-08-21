"use client";

import type { AdminUser, AdminUserStatus } from "@/domain/AdminUser";
import { formatLastAccess } from "@/shared/format";
import { readApiError } from "@/shared/readApiError";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AdminUserActions } from "./AdminUserActions";
import { Avatar } from "./Avatar";
import { ConfirmDialog } from "./ConfirmDialog";

type ConfirmKind = "disable" | "enable" | "delete" | "impersonate";

type PendingConfirm = {
  kind: ConfirmKind;
  user: AdminUser;
};

const STATUS_FILTERS: { id: AdminUserStatus; label: string }[] = [
  { id: "active", label: "Ativo" },
  { id: "disabled", label: "Desabilitado" },
  { id: "unapproved", label: "Não aprovado" },
  { id: "deleted", label: "Excluído" },
];

type AdminUserTableProps = {
  users: AdminUser[];
  currentUserId: number;
};

export function AdminUserTable({ users, currentUserId }: AdminUserTableProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<AdminUserStatus>("active");
  const [error, setError] = useState("");
  const [pendingId, setPendingId] = useState(0);
  const [removedIds, setRemovedIds] = useState<number[]>([]);
  const [statusById, setStatusById] = useState<Record<number, AdminUserStatus>>(
    {},
  );
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(
    null,
  );
  const confirmCopy = pendingConfirm
    ? copyForConfirm(pendingConfirm.kind, pendingConfirm.user.name)
    : null;

  const listedUsers = useMemo(
    () => applyUserOverrides(users, removedIds, statusById),
    [users, removedIds, statusById],
  );

  const visibleUsers = useMemo(() => {
    const byStatus = listedUsers.filter((user) => user.status === status);
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return byStatus;
    }

    return byStatus.filter((user) => matchesUser(user, needle));
  }, [listedUsers, status, query]);

  const statusCounts = useMemo(
    () =>
      STATUS_FILTERS.map((filter) => ({
        ...filter,
        count: listedUsers.filter((user) => user.status === filter.id).length,
      })),
    [listedUsers],
  );

  async function changeStatus(user: AdminUser, nextStatus: "active" | "disabled") {
    const disabling = nextStatus === "disabled";
    const ok = await runUserAction(
      user.id,
      `/api/admin/users/${user.id}/status`,
      "POST",
      { status: nextStatus },
      disabling
        ? "Não foi possível desabilitar o usuário."
        : "Não foi possível habilitar o usuário.",
    );
    if (ok) {
      setStatusById((current) => ({ ...current, [user.id]: nextStatus }));
    }
    return ok;
  }

  async function impersonateUser(user: AdminUser) {
    const ok = await runUserAction(
      user.id,
      `/api/admin/users/${user.id}/impersonate`,
      "POST",
      undefined,
      "Não foi possível representar este usuário.",
    );
    if (ok) {
      router.push("/");
      router.refresh();
    }
    return ok;
  }

  async function removeUser(user: AdminUser) {
    const ok = await runUserAction(
      user.id,
      `/api/admin/users/${user.id}`,
      "DELETE",
      undefined,
      "Não foi possível excluir o usuário.",
    );
    if (ok) {
      setRemovedIds((current) => [...current, user.id]);
    }
    return ok;
  }

  async function runConfirmedAction() {
    if (!pendingConfirm) {
      return;
    }

    const { kind, user } = pendingConfirm;
    await runKindAction(kind, user);
    setPendingConfirm(null);
  }

  async function runKindAction(kind: ConfirmKind, user: AdminUser) {
    if (kind === "disable") {
      return changeStatus(user, "disabled");
    }
    if (kind === "enable") {
      return changeStatus(user, "active");
    }
    if (kind === "delete") {
      return removeUser(user);
    }
    return impersonateUser(user);
  }

  async function runUserAction(
    userId: number,
    url: string,
    method: string,
    body: unknown,
    fallbackError: string,
  ) {
    setError("");
    setPendingId(userId);

    try {
      const response = await fetch(url, {
        method,
        headers:
          body === undefined ? undefined : { "Content-Type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      if (!response.ok) {
        setError(await readApiError(response, fallbackError));
        return false;
      }

      return true;
    } catch {
      setError("Falha de rede ao executar a ação.");
      return false;
    } finally {
      setPendingId(0);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Pesquise por nome, email ou id.</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Pesquise por nome, email ou id."
            className="h-11 w-full rounded-xl border border-zinc-200 bg-white py-2 pr-11 pl-3 text-sm text-zinc-900 outline-none focus:border-teal-600"
          />
          <SearchIcon />
        </label>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as AdminUserStatus)}
          className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-800 outline-none focus:border-teal-600"
        >
          {statusCounts.map((filter) => (
            <option key={filter.id} value={filter.id}>
              {filter.label} ({filter.count})
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => exportUsers(visibleUsers)}
          className="h-11 rounded-xl border border-zinc-200 px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          Exportar
        </button>
      </div>
      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      {visibleUsers.length === 0 ? (
        <p className="text-sm text-zinc-500">Nenhum usuário encontrado.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-zinc-500">
                <th className="pb-3 font-medium">Nome</th>
                <th className="pb-3 font-medium">E-mail</th>
                <th className="pb-3 font-medium">Último acesso</th>
                <th className="pb-3 text-right font-medium">
                  <span className="sr-only">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {visibleUsers.map((user) => (
                <tr key={user.id} className="border-b border-zinc-100">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={user.name} imageUrl={user.imageUrl} size="sm" />
                      <div className="min-w-0">
                        <p className="font-medium text-zinc-900">{user.name}</p>
                        {user.title ? (
                          <p className="text-xs text-zinc-500">{user.title}</p>
                        ) : null}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-zinc-600">{user.email}</td>
                  <td className="py-3 pr-4 text-zinc-600">
                    {formatLastAccess(user.lastLogin)}
                  </td>
                  <td className="py-3 text-right">
                    <AdminUserActions
                      user={user}
                      currentUserId={currentUserId}
                      pending={pendingId === user.id}
                      onDisable={() =>
                        setPendingConfirm({ kind: "disable", user })
                      }
                      onEnable={() =>
                        setPendingConfirm({ kind: "enable", user })
                      }
                      onDelete={() =>
                        setPendingConfirm({ kind: "delete", user })
                      }
                      onImpersonate={() =>
                        setPendingConfirm({ kind: "impersonate", user })
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <ConfirmDialog
        open={confirmCopy !== null}
        title={confirmCopy?.title ?? ""}
        description={confirmCopy?.description}
        confirmLabel={confirmCopy?.confirmLabel ?? ""}
        tone={confirmCopy?.tone}
        pending={pendingId !== 0}
        onCancel={() => {
          if (pendingId === 0) {
            setPendingConfirm(null);
          }
        }}
        onConfirm={() => {
          void runConfirmedAction();
        }}
      />
    </div>
  );
}

function copyForConfirm(kind: ConfirmKind, userName: string) {
  if (kind === "disable") {
    return {
      title: "Tem certeza de que deseja desabilitar esse usuário?",
      description: userName,
      confirmLabel: "Desabilitar",
      tone: "danger" as const,
    };
  }

  if (kind === "enable") {
    return {
      title: "Você tem certeza de que deseja habilitar esse usuário?",
      description: userName,
      confirmLabel: "Habilitar",
      tone: "default" as const,
    };
  }

  if (kind === "delete") {
    return {
      title: "Tem certeza de que deseja excluir o seguinte usuário?",
      description: userName,
      confirmLabel: "Excluir",
      tone: "danger" as const,
    };
  }

  return {
    title: "Você tem certeza de que deseja se passar por esse usuário?",
    description: userName,
    confirmLabel: "Representar",
    tone: "default" as const,
  };
}

function applyUserOverrides(
  users: AdminUser[],
  removedIds: number[],
  statusById: Record<number, AdminUserStatus>,
) {
  return users
    .filter((user) => !removedIds.includes(user.id))
    .map((user) =>
      statusById[user.id] ? { ...user, status: statusById[user.id] } : user,
    );
}

function matchesUser(user: AdminUser, needle: string) {
  return (
    user.name.toLowerCase().includes(needle) ||
    user.email.toLowerCase().includes(needle) ||
    user.username.toLowerCase().includes(needle) ||
    String(user.id) === needle
  );
}

function exportUsers(users: AdminUser[]) {
  const header = ["id", "nome", "titulo", "email", "usuario", "ultimo_acesso"];
  const rows = users.map((user) => [
    user.id,
    user.name,
    user.title,
    user.email,
    user.username,
    formatLastAccess(user.lastLogin),
  ]);
  const csv = [header, ...rows]
    .map((row) => row.map(csvCell).join(";"))
    .join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "usuarios.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function csvCell(value: string | number) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-zinc-400"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3-3" />
    </svg>
  );
}
