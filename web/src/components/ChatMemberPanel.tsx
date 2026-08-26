"use client";

import type { ChatMember } from "@/domain/ChatMember";
import { groupChatMembers } from "@/domain/ChatMember";
import type { VoiceOccupancyRoom, VoiceParticipant } from "@/domain/VoiceRoom";
import { ChatPersonRow } from "./ChatPersonRow";
import { useVoiceOccupancy } from "./ChatVoiceOccupancy";
import { useChatMembers } from "./useChatMembers";

type ChatMemberVoice = {
  channelName: string;
  isDeafened: boolean;
  isMicMuted: boolean;
};

/**
 * Lista lateral dos membros do canal, agrupados por presença.
 * Carrega o roster, cruza com quem está em voz e desenha Online / Offline / Em voz.
 */
export function ChatMemberPanel({
  conversationId,
  currentUserId,
  onClose,
}: {
  conversationId: number;
  currentUserId: number;
  onClose: () => void;
}) {
  const { members, error, isLoading } = useChatMembers(
    conversationId,
    currentUserId,
    true,
  );
  const { occupancyRooms } = useVoiceOccupancy();
  const voiceByUser = voicePresenceByUser(occupancyRooms);
  const groups = groupChatMembers(members, new Set(voiceByUser.keys()));

  return (
    <aside className="absolute inset-y-0 right-0 z-20 flex w-60 shrink-0 flex-col border-l border-zinc-200 bg-zinc-50 shadow-lg lg:static lg:z-0 lg:shadow-none">
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-200 px-3 lg:hidden">
        <p className="text-sm font-semibold text-zinc-800">Membros</p>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-2 py-1 text-sm text-zinc-500 hover:bg-zinc-200 hover:text-zinc-800"
        >
          Fechar
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-3">
        {isLoading ? (
          <p className="px-2 text-sm text-zinc-500">Carregando membros…</p>
        ) : null}
        {error ? <p className="px-2 text-sm text-red-600">{error}</p> : null}
        {!isLoading && !error && groups.length === 0 ? (
          <p className="px-2 text-sm text-zinc-500">Nenhum membro neste canal.</p>
        ) : null}
        {groups.map((group) => (
          <section key={group.status} className="mb-4">
            <h2 className="px-2 pb-1.5 text-[11px] font-semibold tracking-wide text-zinc-500 uppercase">
              {group.title}
            </h2>
            <ul className="flex flex-col gap-0.5">
              {group.members.map((member) => (
                <MemberRow
                  key={member.userId}
                  member={member}
                  voice={voiceByUser.get(member.userId) ?? null}
                />
              ))}
            </ul>
          </section>
        ))}
      </div>
    </aside>
  );
}

/**
 * Uma linha do roster: avatar, status, cargo e texto de presença.
 */
function MemberRow({
  member,
  voice,
}: {
  member: ChatMember;
  voice: ChatMemberVoice | null;
}) {
  return (
    <li className="flex items-center gap-2 rounded-lg px-2 py-1.5">
      <span className="flex min-w-0 flex-1 items-center gap-2">
      <ChatPersonRow
        name={member.name}
        imageUrl={member.imageUrl}
        subtitle={memberSubtitle(member, voice)}
        isOnline={member.isOnline || Boolean(voice)}
      />
      </span>
      {member.isAdmin ? (
        <span className="shrink-0 rounded-md bg-teal-100 px-1.5 py-0.5 text-[10px] font-semibold text-teal-800">
          Admin
        </span>
      ) : null}
    </li>
  );
}

/**
 * Índice de quem está em alguma sala de voz do servidor.
 * Percorre as salas publicadas e guarda o último estado de mídia de cada pessoa.
 */
function voicePresenceByUser(
  rooms: VoiceOccupancyRoom[],
): Map<number, ChatMemberVoice> {
  const byUser = new Map<number, ChatMemberVoice>();
  for (const room of rooms) {
    for (const participant of room.participants) {
      byUser.set(participant.userId, voiceOf(room.name, participant));
    }
  }

  return byUser;
}

function voiceOf(
  channelName: string,
  participant: VoiceParticipant,
): ChatMemberVoice {
  return {
    channelName,
    isDeafened: participant.isDeafened,
    isMicMuted: participant.isMicMuted,
  };
}

/**
 * Escolhe o texto abaixo do nome: estado de voz, senão o título do perfil.
 */
function memberSubtitle(
  member: ChatMember,
  voice: ChatMemberVoice | null,
): string {
  if (!voice) {
    return member.title;
  }

  if (voice.isDeafened) {
    return "Ensurdecido";
  }

  if (voice.isMicMuted) {
    return "Mudo";
  }

  return voice.channelName ? `Em ${voice.channelName}` : "Em voz";
}
