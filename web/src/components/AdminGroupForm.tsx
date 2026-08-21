"use client";

import type { AdminGroup } from "@/domain/AdminGroup";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  AccountCheckbox,
  AccountFeedback,
  AccountField,
  AccountSubmit,
  AccountTextarea,
} from "./AccountField";
import { ConfirmDialog } from "./ConfirmDialog";
import { readApiError } from "@/shared/readApiError";

const GROUPS_HREF = "/administracao/usuarios?aba=grupos";

type AdminGroupFormProps = {
  group?: AdminGroup;
};

export function AdminGroupForm({ group }: AdminGroupFormProps) {
  const router = useRouter();
  const [name, setName] = useState(group?.name ?? "");
  const [description, setDescription] = useState(group?.description ?? "");
  const [showAtDirectory, setShowAtDirectory] = useState(
    group?.showAtDirectory ?? false,
  );
  const [showAtRegistration, setShowAtRegistration] = useState(
    group?.showAtRegistration ?? false,
  );
  const [notifyUsers, setNotifyUsers] = useState(group?.notifyUsers ?? false);
  const [isDefault, setIsDefault] = useState(group?.isDefault ?? false);
  const [sortOrder, setSortOrder] = useState(String(group?.sortOrder ?? 100));
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isAdminGroup = Boolean(group?.isAdminGroup);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch(
        group ? `/api/admin/groups/${group.id}` : "/api/admin/groups",
        {
          method: group ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            description,
            showAtDirectory,
            showAtRegistration: isAdminGroup ? false : showAtRegistration,
            notifyUsers,
            isDefault: isAdminGroup ? false : isDefault,
            sortOrder: Number(sortOrder),
          }),
        },
      );

      if (!response.ok) {
        setError(
          await readApiError(
            response,
            group
              ? "Não foi possível salvar o grupo."
              : "Não foi possível criar o grupo.",
          ),
        );
        return;
      }

      const saved = (await response.json()) as AdminGroup;
      router.push(
        group
          ? GROUPS_HREF
          : `/administracao/usuarios/grupos/${saved.id}/membros`,
      );
      router.refresh();
    } catch {
      setError("Falha de rede ao salvar o grupo.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function deleteGroup() {
    if (!group) {
      return;
    }

    setError("");
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/admin/groups/${group.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        setError(await readApiError(response, "Não foi possível excluir o grupo."));
        setConfirmDelete(false);
        return;
      }

      router.push(GROUPS_HREF);
      router.refresh();
    } catch {
      setError("Falha de rede ao excluir o grupo.");
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
          name="name"
          value={name}
          required
          onChange={setName}
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
        <AccountCheckbox
          label="Visível no diretório de pessoas"
          name="showAtDirectory"
          checked={showAtDirectory}
          onChange={setShowAtDirectory}
        />
        {isAdminGroup ? null : (
          <>
            <AccountCheckbox
              label="Disponível no registro"
              name="showAtRegistration"
              checked={showAtRegistration}
              onChange={setShowAtRegistration}
            />
            <AccountCheckbox
              label="Grupo padrão para novos usuários"
              name="isDefault"
              checked={isDefault}
              onChange={setIsDefault}
            />
          </>
        )}
        <AccountCheckbox
          label="Notificar usuários ao entrar ou sair do grupo"
          name="notifyUsers"
          checked={notifyUsers}
          onChange={setNotifyUsers}
        />
        <AccountFeedback error={error} success="" />
        <div className="flex flex-wrap gap-2">
          <AccountSubmit
            disabled={isSubmitting || isDeleting}
            label={group ? "Salvar" : "Criar grupo"}
            pendingLabel={group ? "Salvando…" : "Criando…"}
          />
          {group?.canDelete ? (
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
        title="Tem certeza de que deseja excluir este grupo?"
        description={group?.name}
        confirmLabel="Excluir"
        tone="danger"
        pending={isDeleting}
        onCancel={() => {
          if (!isDeleting) {
            setConfirmDelete(false);
          }
        }}
        onConfirm={() => {
          void deleteGroup();
        }}
      />
    </>
  );
}
