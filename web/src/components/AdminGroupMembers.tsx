"use client";

import type { AdminGroup, AdminGroupMember } from "@/domain/AdminGroup";
import { readApiError } from "@/shared/readApiError";
import { useMemo, useState } from "react";
import { Avatar } from "./Avatar";
import { ConfirmDialog } from "./ConfirmDialog";

type PickerUser = {
  id: number;
  name: string;
  email: string;
  imageUrl: string;
};

type AdminGroupMembersProps = {
  group: AdminGroup;
  members: AdminGroupMember[];
  users: PickerUser[];
};

export function AdminGroupMembers({
  group,
  members: initialMembers,
  users,
}: AdminGroupMembersProps) {
  const [members, setMembers] = useState(initialMembers);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [addAsManager, setAddAsManager] = useState(false);
  const [error, setError] = useState("");
  const [pendingId, setPendingId] = useState(0);
  const [pendingRemove, setPendingRemove] = useState<AdminGroupMember | null>(
    null,
  );

  const availableUsers = useMemo(() => {
    const memberIds = new Set(members.map((member) => member.id));
    return users.filter((user) => !memberIds.has(user.id));
  }, [members, users]);

  async function addMember() {
    const userId = Number(selectedUserId);
    if (!userId) {
      return;
    }

    setError("");
    setPendingId(userId);

    try {
      const response = await fetch(`/api/admin/groups/${group.id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, isManager: addAsManager }),
      });
      if (!response.ok) {
        setError(await readApiError(response, "Não foi possível adicionar o membro."));
        return;
      }

      const payload = (await response.json()) as { members: AdminGroupMember[] };
      setMembers(payload.members);
      setSelectedUserId("");
      setAddAsManager(false);
    } catch {
      setError("Falha de rede ao adicionar o membro.");
    } finally {
      setPendingId(0);
    }
  }

  async function removeMember() {
    if (!pendingRemove) {
      return;
    }

    setError("");
    setPendingId(pendingRemove.id);

    try {
      const response = await fetch(`/api/admin/groups/${group.id}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: pendingRemove.id }),
      });
      if (!response.ok) {
        setError(await readApiError(response, "Não foi possível remover o membro."));
        return;
      }

      const payload = (await response.json()) as { members: AdminGroupMember[] };
      setMembers(payload.members);
    } catch {
      setError("Falha de rede ao remover o membro.");
    } finally {
      setPendingId(0);
      setPendingRemove(null);
    }
  }

  async function toggleManager(member: AdminGroupMember, isManager: boolean) {
    setError("");
    setPendingId(member.id);

    try {
      const response = await fetch(`/api/admin/groups/${group.id}/manager`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: member.id, isManager }),
      });
      if (!response.ok) {
        setError(
          await readApiError(response, "Não foi possível atualizar o gerente."),
        );
        return;
      }

      const payload = (await response.json()) as { members: AdminGroupMember[] };
      setMembers(payload.members);
    } catch {
      setError("Falha de rede ao atualizar o gerente.");
    } finally {
      setPendingId(0);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 p-4 sm:flex-row sm:items-end">
        <label className="min-w-0 flex-1 text-sm font-medium text-zinc-700">
          Adicionar membro
          <select
            value={selectedUserId}
            onChange={(event) => setSelectedUserId(event.target.value)}
            className="mt-1 h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-teal-600"
          >
            <option value="">Selecione um usuário</option>
            {availableUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </label>
        {group.isAdminGroup ? null : (
          <label className="flex h-11 items-center gap-2 text-sm text-zinc-700">
            <input
              type="checkbox"
              checked={addAsManager}
              onChange={(event) => setAddAsManager(event.target.checked)}
              className="h-4 w-4 accent-teal-600"
            />
            Gerente
          </label>
        )}
        <button
          type="button"
          disabled={!selectedUserId || pendingId !== 0}
          onClick={() => {
            void addMember();
          }}
          className="h-11 rounded-xl bg-teal-700 px-4 text-sm font-semibold text-white disabled:opacity-60"
        >
          Adicionar
        </button>
      </div>
      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      {members.length === 0 ? (
        <p className="text-sm text-zinc-500">Nenhum membro neste grupo.</p>
      ) : (
        <ul className="divide-y divide-zinc-100 rounded-xl border border-zinc-200">
          {members.map((member) => (
            <li
              key={member.id}
              className="flex flex-wrap items-center gap-3 px-4 py-3"
            >
              <Avatar name={member.name} imageUrl={member.imageUrl} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-zinc-900">{member.name}</p>
                <p className="text-xs text-zinc-500">{member.email}</p>
              </div>
              {group.isAdminGroup ? null : (
                <label className="flex items-center gap-2 text-sm text-zinc-600">
                  <input
                    type="checkbox"
                    checked={member.isManager}
                    disabled={pendingId === member.id}
                    onChange={(event) => {
                      void toggleManager(member, event.target.checked);
                    }}
                    className="h-4 w-4 accent-teal-600"
                  />
                  Gerente
                </label>
              )}
              <button
                type="button"
                disabled={pendingId === member.id}
                onClick={() => setPendingRemove(member)}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
              >
                Remover
              </button>
            </li>
          ))}
        </ul>
      )}
      <ConfirmDialog
        open={pendingRemove !== null}
        title="Tem certeza de que deseja remover este membro?"
        description={pendingRemove?.name}
        confirmLabel="Remover"
        tone="danger"
        pending={pendingId !== 0}
        onCancel={() => {
          if (pendingId === 0) {
            setPendingRemove(null);
          }
        }}
        onConfirm={() => {
          void removeMember();
        }}
      />
    </div>
  );
}
