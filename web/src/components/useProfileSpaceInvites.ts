"use client";

import { useState } from "react";
import type { ReceivedSpaceInvite } from "@/domain/SpaceInvite";
import { readApiError } from "@/shared/readApiError";

export function useProfileSpaceInvites(initialInvites: ReceivedSpaceInvite[]) {
  const [invites, setInvites] = useState(initialInvites);
  const [pendingId, setPendingId] = useState(0);
  const [error, setError] = useState("");

  async function resolveInvite(spaceId: number, action: "accept" | "decline") {
    setError("");
    setPendingId(spaceId);
    try {
      const response = await fetch(`/api/spaces/invites/${spaceId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!response.ok) {
        setError(await readApiError(response, "Não foi possível atualizar o convite."));
        return;
      }

      setInvites((current) =>
        current.filter((invite) => invite.spaceId !== spaceId),
      );
    } catch {
      setError("Falha de rede ao atualizar o convite.");
    } finally {
      setPendingId(0);
    }
  }

  return {
    invites,
    pendingId,
    error,
    accept: (spaceId: number) => resolveInvite(spaceId, "accept"),
    decline: (spaceId: number) => resolveInvite(spaceId, "decline"),
  };
}
