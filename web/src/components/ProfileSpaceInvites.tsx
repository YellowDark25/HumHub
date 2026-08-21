"use client";

import type { ReceivedSpaceInvite } from "@/domain/SpaceInvite";
import { Avatar } from "./Avatar";
import { useProfileSpaceInvites } from "./useProfileSpaceInvites";

type ProfileSpaceInvitesProps = {
  invites: ReceivedSpaceInvite[];
};

export function ProfileSpaceInvites({ invites: initialInvites }: ProfileSpaceInvitesProps) {
  const { invites, pendingId, error, accept, decline } =
    useProfileSpaceInvites(initialInvites);

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5">
      <h2 className="text-sm font-semibold text-zinc-900">Convites recebidos</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Aceite para entrar no espaço ou recuse o convite.
      </p>
      {error ? (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      {invites.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-500">Nenhum convite pendente.</p>
      ) : (
        <ul className="mt-4 divide-y divide-zinc-100">
          {invites.map((invite) => (
            <InviteRow
              key={invite.spaceId}
              invite={invite}
              pending={pendingId === invite.spaceId}
              disabled={pendingId > 0}
              onAccept={() => void accept(invite.spaceId)}
              onDecline={() => void decline(invite.spaceId)}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function InviteRow({
  invite,
  pending,
  disabled,
  onAccept,
  onDecline,
}: {
  invite: ReceivedSpaceInvite;
  pending: boolean;
  disabled: boolean;
  onAccept: () => void;
  onDecline: () => void;
}) {
  return (
    <li className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
      <Avatar
        name={invite.spaceName}
        imageUrl={invite.spaceImageUrl}
        size="sm"
        shape="square"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-zinc-900">
          {invite.spaceName}
        </p>
        <p className="truncate text-xs text-zinc-500">
          {invite.invitedByName
            ? `${invite.invitedByName} convidou você`
            : "Convite pendente"}
        </p>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={onDecline}
          className="h-9 rounded-xl border border-zinc-200 px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
        >
          Recusar
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={onAccept}
          className="h-9 rounded-xl bg-teal-700 px-3 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
        >
          {pending ? "Aguarde…" : "Aceitar"}
        </button>
      </div>
    </li>
  );
}
