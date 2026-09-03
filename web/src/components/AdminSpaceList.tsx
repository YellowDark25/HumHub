"use client";

import type { Space } from "@/domain/Space";
import { readApiError } from "@/shared/readApiError";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ConfirmDialog } from "./ConfirmDialog";

type AdminSpaceListProps = {
  spaces: Space[];
};

/**
 * Lista administrativa de espaços com abertura e exclusão.
 * Mostra nome e descrição; "Abrir" leva ao espaço e "Excluir" pede confirmação,
 * chama DELETE /api/admin/spaces/{id} e some com o item da lista se der certo.
 */
export function AdminSpaceList({ spaces }: AdminSpaceListProps) {
  const [error, setError] = useState("");
  const [pendingId, setPendingId] = useState(0);
  const [removedIds, setRemovedIds] = useState<number[]>([]);
  const [pendingDelete, setPendingDelete] = useState<Space | null>(null);

  const visibleSpaces = useMemo(
    () => spaces.filter((space) => !removedIds.includes(space.id)),
    [spaces, removedIds],
  );

  /**
   * Confirma a exclusão do espaço selecionado.
   * Envia DELETE à API; em sucesso remove o item da lista, em falha exibe a mensagem.
   */
  async function deleteSpace() {
    if (!pendingDelete) {
      return;
    }

    setError("");
    setPendingId(pendingDelete.id);

    try {
      const response = await fetch(`/api/admin/spaces/${pendingDelete.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        setError(
          await readApiError(response, "Não foi possível excluir o espaço."),
        );
        return;
      }

      setRemovedIds((current) => [...current, pendingDelete.id]);
    } catch {
      setError("Falha de rede ao excluir o espaço.");
    } finally {
      setPendingId(0);
      setPendingDelete(null);
    }
  }

  if (visibleSpaces.length === 0) {
    return <p className="text-sm text-zinc-500">Nenhum espaço encontrado.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200">
        {visibleSpaces.map((space) => (
          <li
            key={space.id}
            className="flex items-center justify-between gap-3 px-4 py-4"
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold text-zinc-900">{space.name}</p>
              {space.description ? (
                <p className="mt-1 text-sm text-zinc-500">{space.description}</p>
              ) : null}
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <Link
                href={`/espacos/${space.id}`}
                className="text-sm font-medium text-teal-700"
              >
                Abrir
              </Link>
              <button
                type="button"
                disabled={pendingId === space.id}
                onClick={() => setPendingDelete(space)}
                className="text-sm font-medium text-red-700 disabled:opacity-60"
              >
                Excluir
              </button>
            </div>
          </li>
        ))}
      </ul>
      <ConfirmDialog
        open={pendingDelete !== null}
        title="Tem certeza de que deseja excluir este espaço?"
        description={
          pendingDelete
            ? `${pendingDelete.name} e todo o conteúdo dele serão removidos.`
            : undefined
        }
        confirmLabel="Excluir"
        tone="danger"
        pending={pendingId !== 0}
        onCancel={() => {
          if (pendingId === 0) {
            setPendingDelete(null);
          }
        }}
        onConfirm={() => {
          void deleteSpace();
        }}
      />
    </div>
  );
}
