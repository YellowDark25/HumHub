import { NextResponse } from "next/server";
import { app } from "@/infrastructure/composition";
import { jsonError } from "@/infrastructure/http/jsonError";
import { requireAuthToken } from "@/infrastructure/http/requireAuth";

type ChannelRouteProps = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: ChannelRouteProps) {
  try {
    const token = await requireAuthToken();
    const settings = await app.getChannelSettings(token, Number((await params).id));
    return NextResponse.json(settings);
  } catch (error) {
    return jsonError(error, "Não foi possível carregar o canal.");
  }
}

export async function PATCH(request: Request, { params }: ChannelRouteProps) {
  const body = (await request.json().catch(() => null)) as {
    name?: string;
    topic?: string;
    slowModeSeconds?: number;
  } | null;

  try {
    const token = await requireAuthToken();
    const conversation = await app.updateChannel(
      token,
      Number((await params).id),
      {
        name: body?.name ?? "",
        topic: body?.topic ?? "",
        slowModeSeconds: Number(body?.slowModeSeconds ?? 0),
      },
    );
    return NextResponse.json(conversation);
  } catch (error) {
    return jsonError(error, "Não foi possível salvar o canal.");
  }
}

export async function DELETE(_request: Request, { params }: ChannelRouteProps) {
  try {
    const token = await requireAuthToken();
    await app.deleteChannel(token, Number((await params).id));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error, "Não foi possível excluir o canal.");
  }
}
