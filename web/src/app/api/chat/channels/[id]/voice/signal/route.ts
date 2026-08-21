import { NextResponse } from "next/server";
import { app } from "@/infrastructure/composition";
import { jsonError } from "@/infrastructure/http/jsonError";
import { requireAuthToken } from "@/infrastructure/http/requireAuth";

type SignalRouteProps = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: SignalRouteProps) {
  try {
    const token = await requireAuthToken();
    const signals = await app.pullVoiceSignals(
      token,
      Number((await params).id),
    );
    return NextResponse.json({ signals });
  } catch (error) {
    return jsonError(error, "Não foi possível receber os sinais de voz.");
  }
}

export async function POST(request: Request, { params }: SignalRouteProps) {
  const body = (await request.json().catch(() => null)) as {
    toUserId?: number;
    kind?: string;
    payload?: Record<string, unknown>;
  } | null;

  try {
    const token = await requireAuthToken();
    const signal = await app.sendVoiceSignal(
      token,
      Number((await params).id),
      Number(body?.toUserId ?? 0),
      body?.kind ?? "",
      isPayload(body?.payload) ? body.payload : {},
    );
    return NextResponse.json(signal);
  } catch (error) {
    return jsonError(error, "Não foi possível enviar o sinal de voz.");
  }
}

function isPayload(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
