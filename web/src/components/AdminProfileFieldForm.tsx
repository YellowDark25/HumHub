"use client";

import type {
  AdminProfileCategory,
  AdminProfileField,
  AdminProfileFieldKind,
  AdminProfileFieldType,
} from "@/domain/AdminProfile";
import { readApiError } from "@/shared/readApiError";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  AccountCheckbox,
  AccountFeedback,
  AccountField,
  AccountSelect,
  AccountSubmit,
  AccountTextarea,
} from "./AccountField";
import { ConfirmDialog } from "./ConfirmDialog";

type AdminProfileFieldFormProps = {
  field?: AdminProfileField;
  categories: AdminProfileCategory[];
  fieldTypes: AdminProfileFieldType[];
  defaultCategoryId: number;
};

export function AdminProfileFieldForm({
  field,
  categories,
  fieldTypes,
  defaultCategoryId,
}: AdminProfileFieldFormProps) {
  const router = useRouter();
  const [categoryId, setCategoryId] = useState(
    String(field?.categoryId || defaultCategoryId),
  );
  const [title, setTitle] = useState(field?.title ?? "");
  const [internalName, setInternalName] = useState(field?.internalName ?? "");
  const [description, setDescription] = useState(field?.description ?? "");
  const [kind, setKind] = useState<AdminProfileFieldKind | "">(
    field?.kind && fieldTypes.some((type) => type.id === field.kind)
      ? field.kind
      : fieldTypes[0]?.id ?? "",
  );
  const [sortOrder, setSortOrder] = useState(String(field?.sortOrder ?? 100));
  const [isRequired, setIsRequired] = useState(field?.isRequired ?? false);
  const [isVisible, setIsVisible] = useState(field?.isVisible ?? true);
  const [isEditable, setIsEditable] = useState(field?.isEditable ?? true);
  const [isSearchable, setIsSearchable] = useState(field?.isSearchable ?? true);
  const [showAtRegistration, setShowAtRegistration] = useState(
    field?.showAtRegistration ?? false,
  );
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isVirtual = Boolean(field?.isVirtual);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch(
        field ? `/api/admin/profile-fields/${field.id}` : "/api/admin/profile-fields",
        {
          method: field ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            categoryId: Number(categoryId),
            title,
            internalName,
            description,
            kind,
            sortOrder: Number(sortOrder),
            isRequired,
            isVisible,
            isEditable,
            isSearchable,
            showAtRegistration,
          }),
        },
      );

      if (!response.ok) {
        setError(
          await readApiError(
            response,
            field
              ? "Não foi possível salvar o campo."
              : "Não foi possível criar o campo.",
          ),
        );
        return;
      }

      const saved = (await response.json()) as AdminProfileField;
      router.push(
        `/administracao/usuarios?aba=perfis&categoria=${saved.categoryId}`,
      );
      router.refresh();
    } catch {
      setError("Falha de rede ao salvar o campo.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function deleteField() {
    if (!field) {
      return;
    }

    setError("");
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/admin/profile-fields/${field.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        setError(
          await readApiError(response, "Não foi possível excluir o campo."),
        );
        setConfirmDelete(false);
        return;
      }

      router.push(
        `/administracao/usuarios?aba=perfis&categoria=${field.categoryId}`,
      );
      router.refresh();
    } catch {
      setError("Falha de rede ao excluir o campo.");
      setConfirmDelete(false);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="flex max-w-xl flex-col gap-4">
        <AccountSelect
          label="Categoria"
          name="categoryId"
          value={categoryId}
          options={categories.map((category) => ({
            value: String(category.id),
            label: category.title,
          }))}
          onChange={setCategoryId}
        />
        <AccountField
          label="Título"
          name="title"
          value={title}
          required
          onChange={setTitle}
        />
        {field ? (
          <p className="text-sm text-zinc-500">
            Nome interno: {field.internalName}
          </p>
        ) : (
          <AccountField
            label="Nome interno"
            name="internalName"
            value={internalName}
            required
            hint="Letras, números e underline, sem espaços. Não muda depois de criado."
            onChange={setInternalName}
          />
        )}
        {field ? (
          <p className="text-sm text-zinc-500">
            Tipo: {field.kindLabel}
          </p>
        ) : (
          <AccountSelect
            label="Tipo"
            name="kind"
            value={kind}
            options={fieldTypes.map((type) => ({
              value: type.id,
              label: type.label,
            }))}
            onChange={(value) => setKind(value as AdminProfileFieldKind)}
          />
        )}
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
        {isVirtual ? null : (
          <>
            <AccountCheckbox
              label="Obrigatório"
              name="isRequired"
              checked={isRequired}
              onChange={setIsRequired}
            />
            <AccountCheckbox
              label="Editável pelo usuário"
              name="isEditable"
              checked={isEditable}
              onChange={setIsEditable}
            />
            <AccountCheckbox
              label="Pesquisável"
              name="isSearchable"
              checked={isSearchable}
              onChange={setIsSearchable}
            />
            <AccountCheckbox
              label="Exibir no cadastro"
              name="showAtRegistration"
              checked={showAtRegistration}
              onChange={setShowAtRegistration}
            />
          </>
        )}
        <AccountCheckbox
          label="Visível no perfil"
          name="isVisible"
          checked={isVisible}
          onChange={setIsVisible}
        />
        <AccountFeedback error={error} success="" />
        <div className="flex flex-wrap gap-2">
          <AccountSubmit
            disabled={isSubmitting || isDeleting}
            label={field ? "Salvar" : "Criar campo"}
            pendingLabel={field ? "Salvando…" : "Criando…"}
          />
          {field?.canDelete ? (
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
        title="Excluir este campo?"
        description={field?.title}
        confirmLabel="Excluir"
        tone="danger"
        pending={isDeleting}
        onCancel={() => {
          if (!isDeleting) {
            setConfirmDelete(false);
          }
        }}
        onConfirm={() => {
          void deleteField();
        }}
      />
    </>
  );
}
