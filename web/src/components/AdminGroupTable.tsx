"use client";

import type { AdminGroup, AdminGroupType } from "@/domain/AdminGroup";
import { readApiError } from "@/shared/readApiError";
import { useMemo, useState } from "react";
import { AdminGroupActions } from "./AdminGroupActions";
import { ConfirmDialog } from "./ConfirmDialog";

const TYPE_FILTERS: { id: "" | AdminGroupType; label: string }[] = [
  { id: "", label: "Todos" },
  { id: "normal", label: "Normal" },
  { id: "subgroup", label: "Subgrupo" },
];

type AdminGroupTableProps = {
  groups: AdminGroup[];
};

export function AdminGroupTable({ groups }: AdminGroupTableProps) {
  const [nameQuery, setNameQuery] = useState("");
  const [descriptionQuery, setDescriptionQuery] = useState("");
  const [type, setType] = useState<"" | AdminGroupType>("");
  const [error, setError] = useState("");
  const [pendingId, setPendingId] = useState(0);
  const [removedIds, setRemovedIds] = useState<number[]>([]);
  const [pendingDelete, setPendingDelete] = useState<AdminGroup | null>(null);

  const listedGroups = useMemo(
    () => groups.filter((group) => !removedIds.includes(group.id)),
    [groups, removedIds],
  );

  const visibleGroups = useMemo(() => {
    const nameNeedle = nameQuery.trim().toLowerCase();
    const descriptionNeedle = descriptionQuery.trim().toLowerCase();

    return listedGroups.filter((group) => {
      if (type && group.type !== type) {
        return false;
      }

      if (nameNeedle && !group.name.toLowerCase().includes(nameNeedle)) {
        return false;
      }

      if (
        descriptionNeedle &&
        !group.description.toLowerCase().includes(descriptionNeedle)
      ) {
        return false;
      }

      return true;
    });
  }, [listedGroups, nameQuery, descriptionQuery, type]);

  async function deleteGroup() {
    if (!pendingDelete) {
      return;
    }

    setError("");
    setPendingId(pendingDelete.id);

    try {
      const response = await fetch(`/api/admin/groups/${pendingDelete.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        setError(await readApiError(response, "Não foi possível excluir o grupo."));
        return;
      }

      setRemovedIds((current) => [...current, pendingDelete.id]);
    } catch {
      setError("Falha de rede ao excluir o grupo.");
    } finally {
      setPendingId(0);
      setPendingDelete(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-zinc-500">
        {visibleCountLabel(visibleGroups.length, listedGroups.length)}
      </p>
      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-zinc-500">
              <th className="pb-3 font-medium">Nome</th>
              <th className="pb-3 font-medium">Descrição</th>
              <th className="pb-3 font-medium">Tipo</th>
              <th className="pb-3 text-right font-medium">Membros</th>
              <th className="pb-3 text-right font-medium">
                <span className="sr-only">Ações</span>
              </th>
            </tr>
            <tr className="border-b border-zinc-200">
              <th className="py-2 pr-3 font-normal">
                <input
                  value={nameQuery}
                  onChange={(event) => setNameQuery(event.target.value)}
                  aria-label="Filtrar por nome"
                  className="h-9 w-full rounded-lg border border-zinc-200 px-2 text-sm text-zinc-900 outline-none focus:border-teal-600"
                />
              </th>
              <th className="py-2 pr-3 font-normal">
                <input
                  value={descriptionQuery}
                  onChange={(event) => setDescriptionQuery(event.target.value)}
                  aria-label="Filtrar por descrição"
                  className="h-9 w-full rounded-lg border border-zinc-200 px-2 text-sm text-zinc-900 outline-none focus:border-teal-600"
                />
              </th>
              <th className="py-2 pr-3 font-normal">
                <select
                  value={type}
                  onChange={(event) =>
                    setType(event.target.value as "" | AdminGroupType)
                  }
                  aria-label="Filtrar por tipo"
                  className="h-9 rounded-lg border border-zinc-200 bg-white px-2 text-sm text-zinc-800 outline-none focus:border-teal-600"
                >
                  {TYPE_FILTERS.map((filter) => (
                    <option key={filter.id || "all"} value={filter.id}>
                      {filter.label}
                    </option>
                  ))}
                </select>
              </th>
              <th className="py-2" />
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {visibleGroups.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-6 text-sm text-zinc-500">
                  Nenhum grupo encontrado.
                </td>
              </tr>
            ) : (
              visibleGroups.map((group) => (
                <tr key={group.id} className="border-b border-zinc-100">
                  <td className="py-3 pr-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-zinc-900">
                        {group.name}
                      </span>
                      {group.isDefault ? <Badge label="Padrão" /> : null}
                      {group.isProtected ? <Badge label="Protegido" /> : null}
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-zinc-600">
                    {group.description}
                  </td>
                  <td className="py-3 pr-4">
                    <Badge
                      label={group.type === "subgroup" ? "Subgrupo" : "Normal"}
                    />
                  </td>
                  <td className="py-3 pr-4 text-right text-zinc-700">
                    {memberCountLabel(group)}
                  </td>
                  <td className="py-3 text-right">
                    <AdminGroupActions
                      group={group}
                      pending={pendingId === group.id}
                      onDelete={() => setPendingDelete(group)}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <ConfirmDialog
        open={pendingDelete !== null}
        title="Tem certeza de que deseja excluir este grupo?"
        description={pendingDelete?.name}
        confirmLabel="Excluir"
        tone="danger"
        pending={pendingId !== 0}
        onCancel={() => {
          if (pendingId === 0) {
            setPendingDelete(null);
          }
        }}
        onConfirm={() => {
          void deleteGroup();
        }}
      />
    </div>
  );
}

function memberCountLabel(group: AdminGroup) {
  if (group.extraMemberCount > 0) {
    return `${group.memberCount} (+${group.extraMemberCount})`;
  }

  return String(group.memberCount);
}

function visibleCountLabel(visible: number, total: number) {
  if (visible === 0) {
    return `Exibindo 0 de ${total} itens.`;
  }

  return `Exibindo 1-${visible} de ${total} itens.`;
}

function Badge({ label }: { label: string }) {
  return (
    <span className="rounded-md border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-zinc-600 uppercase">
      {label}
    </span>
  );
}
