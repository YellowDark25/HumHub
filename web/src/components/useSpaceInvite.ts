"use client";

import { useEffect, useMemo, useState } from "react";
import type { SpaceInvitee } from "@/domain/SpaceInvite";
import { readApiError } from "@/shared/readApiError";

const EMPTY_USERS: SpaceInvitee[] = [];

export function useSpaceInvite(spaceId: number, open: boolean) {
  const [users, setUsers] = useState<SpaceInvitee[]>(EMPTY_USERS);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [query, setQuery] = useState("");
  const [selectAllRegistered, setSelectAllRegistered] = useState(false);
  const [addWithoutInvite, setAddWithoutInvite] = useState(false);
  const [addAsDefaultSpace, setAddAsDefaultSpace] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    setSelectedIds([]);
    setQuery("");
    setSelectAllRegistered(false);
    setAddWithoutInvite(false);
    setAddAsDefaultSpace(false);
    setError("");
    setIsLoading(true);

    void loadInvitees(spaceId)
      .then(setUsers)
      .catch((caught: unknown) => {
        setError(
          caught instanceof Error
            ? caught.message
            : "Não foi possível carregar os usuários.",
        );
      })
      .finally(() => setIsLoading(false));
  }, [open, spaceId]);

  const selectedUsers = useMemo(
    () => users.filter((user) => selectedIds.includes(user.id)),
    [users, selectedIds],
  );

  const suggestions = useMemo(() => {
    const term = query.trim().toLowerCase();
    const available = users.filter((user) => !selectedIds.includes(user.id));
    if (!term) {
      return available.slice(0, 8);
    }

    return available
      .filter(
        (user) =>
          user.name.toLowerCase().includes(term) ||
          user.username.toLowerCase().includes(term),
      )
      .slice(0, 8);
  }, [users, selectedIds, query]);

  function addUser(userId: number) {
    setSelectedIds((current) =>
      current.includes(userId) ? current : [...current, userId],
    );
    setQuery("");
  }

  function removeUser(userId: number) {
    setSelectedIds((current) => current.filter((id) => id !== userId));
  }

  async function send() {
    setError("");
    setIsSending(true);
    try {
      const response = await fetch(`/api/spaces/${spaceId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userIds: selectedIds,
          selectAllRegistered,
          addWithoutInvite,
          addAsDefaultSpace,
        }),
      });
      if (!response.ok) {
        setError(await readApiError(response, "Não foi possível enviar os convites."));
        return false;
      }

      return true;
    } catch {
      setError("Falha de rede ao enviar os convites.");
      return false;
    } finally {
      setIsSending(false);
    }
  }

  return {
    users,
    selectedUsers,
    suggestions,
    query,
    setQuery,
    selectAllRegistered,
    setSelectAllRegistered,
    addWithoutInvite,
    setAddWithoutInvite,
    addAsDefaultSpace,
    setAddAsDefaultSpace,
    isLoading,
    isSending,
    error,
    addUser,
    removeUser,
    send,
  };
}

async function loadInvitees(spaceId: number): Promise<SpaceInvitee[]> {
  const response = await fetch(`/api/spaces/${spaceId}/invite`);
  if (!response.ok) {
    throw new Error(await readApiError(response, "Não foi possível carregar os usuários."));
  }

  const payload = (await response.json()) as { users?: SpaceInvitee[] };
  return payload.users ?? [];
}
