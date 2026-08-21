"use client";

import type {
  AdminProfileCatalog,
  AdminProfileCategory,
  AdminProfileField,
} from "@/domain/AdminProfile";
import { readApiError } from "@/shared/readApiError";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ConfirmDialog } from "./ConfirmDialog";

type AdminProfileCatalogViewProps = {
  catalog: AdminProfileCatalog;
  selectedCategoryId: number;
};

type PendingDelete =
  | { kind: "category"; item: AdminProfileCategory }
  | { kind: "field"; item: AdminProfileField }
  | null;

export function AdminProfileCatalogView({
  catalog,
  selectedCategoryId,
}: AdminProfileCatalogViewProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pendingId, setPendingId] = useState("");
  const [pendingDelete, setPendingDelete] = useState<PendingDelete>(null);
  const category =
    catalog.categories.find((item) => item.id === selectedCategoryId) ??
    catalog.categories[0];

  async function confirmDelete() {
    if (!pendingDelete) {
      return;
    }

    setError("");
    const key =
      pendingDelete.kind === "category"
        ? `category-${pendingDelete.item.id}`
        : `field-${pendingDelete.item.id}`;
    setPendingId(key);

    try {
      const response = await fetch(deleteHref(pendingDelete), {
        method: "DELETE",
      });
      if (!response.ok) {
        setError(
          await readApiError(
            response,
            pendingDelete.kind === "category"
              ? "Não foi possível excluir a categoria."
              : "Não foi possível excluir o campo.",
          ),
        );
        return;
      }

      router.refresh();
    } catch {
      setError("Falha de rede ao excluir.");
    } finally {
      setPendingId("");
      setPendingDelete(null);
    }
  }

  if (!category) {
    return (
      <p className="text-sm text-zinc-500">
        Nenhuma categoria de perfil ainda. Crie a primeira para começar.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <nav
        aria-label="Categorias de perfil"
        className="flex flex-wrap gap-2 border-b border-zinc-200 pb-3"
      >
        {catalog.categories.map((item) => (
          <Link
            key={item.id}
            href={`/administracao/usuarios?aba=perfis&categoria=${item.id}`}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              item.id === category.id
                ? "bg-teal-700 text-white"
                : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
            }`}
          >
            {item.title}
          </Link>
        ))}
      </nav>
      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-zinc-900">
            {category.title}
          </h2>
          {category.description ? (
            <p className="mt-1 text-sm text-zinc-500">{category.description}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/administracao/usuarios/perfis/campos/novo?categoria=${category.id}`}
            className="inline-flex h-9 items-center rounded-lg bg-teal-700 px-3 text-sm font-semibold text-white"
          >
            Novo campo
          </Link>
          <Link
            href={`/administracao/usuarios/perfis/categorias/${category.id}`}
            className="inline-flex h-9 items-center rounded-lg border border-zinc-200 px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Editar categoria
          </Link>
          {category.canDelete ? (
            <button
              type="button"
              disabled={pendingId !== ""}
              onClick={() =>
                setPendingDelete({ kind: "category", item: category })
              }
              className="inline-flex h-9 items-center rounded-lg border border-red-200 px-3 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
            >
              Excluir categoria
            </button>
          ) : null}
        </div>
      </div>
      <FieldTable
        fields={category.fields}
        pendingId={pendingId}
        onDelete={(field) => setPendingDelete({ kind: "field", item: field })}
      />
      <ConfirmDialog
        open={pendingDelete !== null}
        title={
          pendingDelete?.kind === "category"
            ? "Excluir esta categoria?"
            : "Excluir este campo?"
        }
        description={
          pendingDelete?.kind === "category"
            ? pendingDelete.item.title
            : pendingDelete?.item.title
        }
        confirmLabel="Excluir"
        tone="danger"
        pending={pendingId !== ""}
        onCancel={() => {
          if (pendingId === "") {
            setPendingDelete(null);
          }
        }}
        onConfirm={() => {
          void confirmDelete();
        }}
      />
    </div>
  );
}

function FieldTable({
  fields,
  pendingId,
  onDelete,
}: {
  fields: AdminProfileField[];
  pendingId: string;
  onDelete: (field: AdminProfileField) => void;
}) {
  if (fields.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-6 text-sm text-zinc-500">
        Esta categoria ainda não tem campos.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-200 text-zinc-500">
            <th className="pb-3 font-medium">Título</th>
            <th className="pb-3 font-medium">Nome interno</th>
            <th className="pb-3 font-medium">Tipo</th>
            <th className="pb-3 font-medium">Obrigatório</th>
            <th className="pb-3 font-medium">Visível</th>
            <th className="pb-3 font-medium">Editável</th>
            <th className="pb-3 text-right font-medium">Ordem</th>
            <th className="pb-3 text-right font-medium">
              <span className="sr-only">Ações</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {fields.map((field) => (
            <tr key={field.id} className="border-b border-zinc-100">
              <td className="py-3 pr-4 font-medium text-zinc-900">
                {field.title}
              </td>
              <td className="py-3 pr-4 text-zinc-600">{field.internalName}</td>
              <td className="py-3 pr-4 text-zinc-600">{field.kindLabel}</td>
              <td className="py-3 pr-4 text-zinc-600">
                {flagLabel(field.isRequired, field.isVirtual)}
              </td>
              <td className="py-3 pr-4 text-zinc-600">
                {flagLabel(field.isVisible, false)}
              </td>
              <td className="py-3 pr-4 text-zinc-600">
                {flagLabel(field.isEditable, field.isVirtual)}
              </td>
              <td className="py-3 pr-4 text-right text-zinc-700">
                {field.sortOrder}
              </td>
              <td className="py-3 text-right">
                <div className="flex justify-end gap-3">
                  <Link
                    href={`/administracao/usuarios/perfis/campos/${field.id}`}
                    className="text-sm font-medium text-teal-700"
                  >
                    Editar
                  </Link>
                  {field.canDelete ? (
                    <button
                      type="button"
                      disabled={pendingId !== ""}
                      onClick={() => onDelete(field)}
                      className="text-sm font-medium text-red-700 disabled:opacity-60"
                    >
                      Excluir
                    </button>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function deleteHref(pending: Exclude<PendingDelete, null>) {
  if (pending.kind === "category") {
    return `/api/admin/profile-categories/${pending.item.id}`;
  }

  return `/api/admin/profile-fields/${pending.item.id}`;
}

function flagLabel(value: boolean, hidden: boolean) {
  if (hidden) {
    return "—";
  }

  return value ? "Sim" : "Não";
}
