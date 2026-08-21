"use client";

import type { AdminProfileCategory } from "@/domain/AdminProfile";
import { readApiError } from "@/shared/readApiError";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  AccountFeedback,
  AccountField,
  AccountSubmit,
  AccountTextarea,
} from "./AccountField";
import { ConfirmDialog } from "./ConfirmDialog";

const CATALOG_HREF = "/administracao/usuarios?aba=perfis";

type AdminProfileCategoryFormProps = {
  category?: AdminProfileCategory;
};

export function AdminProfileCategoryForm({
  category,
}: AdminProfileCategoryFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(category?.title ?? "");
  const [description, setDescription] = useState(category?.description ?? "");
  const [sortOrder, setSortOrder] = useState(String(category?.sortOrder ?? 100));
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch(
        category
          ? `/api/admin/profile-categories/${category.id}`
          : "/api/admin/profile-categories",
        {
          method: category ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            description,
            sortOrder: Number(sortOrder),
          }),
        },
      );

      if (!response.ok) {
        setError(
          await readApiError(
            response,
            category
              ? "Não foi possível salvar a categoria."
              : "Não foi possível criar a categoria.",
          ),
        );
        return;
      }

      const saved = (await response.json()) as AdminProfileCategory;
      router.push(`${CATALOG_HREF}&categoria=${saved.id}`);
      router.refresh();
    } catch {
      setError("Falha de rede ao salvar a categoria.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function deleteCategory() {
    if (!category) {
      return;
    }

    setError("");
    setIsDeleting(true);

    try {
      const response = await fetch(
        `/api/admin/profile-categories/${category.id}`,
        { method: "DELETE" },
      );
      if (!response.ok) {
        setError(
          await readApiError(
            response,
            "Não foi possível excluir a categoria.",
          ),
        );
        setConfirmDelete(false);
        return;
      }

      router.push(CATALOG_HREF);
      router.refresh();
    } catch {
      setError("Falha de rede ao excluir a categoria.");
      setConfirmDelete(false);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="flex max-w-xl flex-col gap-4">
        <AccountField
          label="Nome"
          name="title"
          value={title}
          required
          onChange={setTitle}
        />
        <AccountTextarea
          label="Descrição"
          name="description"
          value={description}
          onChange={setDescription}
        />
        <AccountField
          label="Ordem"
          name="sortOrder"
          value={sortOrder}
          onChange={setSortOrder}
        />
        <AccountFeedback error={error} success="" />
        <div className="flex flex-wrap gap-2">
          <AccountSubmit
            disabled={isSubmitting || isDeleting}
            label={category ? "Salvar" : "Criar categoria"}
            pendingLabel={category ? "Salvando…" : "Criando…"}
          />
          {category?.canDelete ? (
            <button
              type="button"
              disabled={isSubmitting || isDeleting}
              onClick={() => setConfirmDelete(true)}
              className="h-11 rounded-xl border border-red-200 px-5 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
            >
              Excluir
            </button>
          ) : null}
        </div>
      </form>
      <ConfirmDialog
        open={confirmDelete}
        title="Excluir esta categoria?"
        description={category?.title}
        confirmLabel="Excluir"
        tone="danger"
        pending={isDeleting}
        onCancel={() => {
          if (!isDeleting) {
            setConfirmDelete(false);
          }
        }}
        onConfirm={() => {
          void deleteCategory();
        }}
      />
    </>
  );
}
