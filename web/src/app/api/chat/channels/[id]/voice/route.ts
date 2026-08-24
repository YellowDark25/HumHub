import { NextResponse } from "next/server";
import { readVoiceMedia } from "@/domain/VoiceRoom";
import { app } from "@/infrastructure/composition";
import { jsonError } from "@/infrastructure/http/jsonError";
import { requireAuthToken } from "@/infrastructure/http/requireAuth";
import { readPublicClientUrl } from "@/shared/publicClientUrl";
import { rewriteLoopbackUrl } from "@/shared/rewriteLoopbackUrl";

type VoiceRouteProps = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: VoiceRouteProps) {
  try {
    const token = await requireAuthToken();
    const room = await app.listVoiceRoom(token, Number((await params).id));
    return NextResponse.json(room);
  } catch (error) {
    return jsonError(error, "Não foi possível carregar a sala de voz.");
  }
}

export async function POST(request: Request, { params }: VoiceRouteProps) {
  const body = (await request.json().catch(() => null)) as
    | Partial<ReturnType<typeof readVoiceMedia>>
    | null;

  try {
    const token = await requireAuthToken();
    const session = await app.joinVoiceRoom(
      token,
      Number((await params).id),
      readVoiceMedia(body),
    );
    return NextResponse.json({
      ...session,
      url: rewriteLoopbackUrl(
        session.url,
        readPublicClientUrl(request),
        process.env.LIVEKIT_NODE_IP,
      ),
    });
  } catch (error) {
    return jsonError(error, "Não foi possível entrar na sala de voz.");
  }
}

export async function DELETE(_request: Request, { params }: VoiceRouteProps) {
  try {
    const token = await requireAuthToken();
    const room = await app.leaveVoiceRoom(token, Number((await params).id));
    return NextResponse.json(room);
  } catch (error) {
    return jsonError(error, "Não foi possível sair da sala de voz.");
  }
}
