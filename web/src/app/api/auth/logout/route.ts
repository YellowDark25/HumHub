import { NextResponse } from "next/server";
import { clearAuthToken } from "@/infrastructure/session";

export async function POST() {
  await clearAuthToken();
  return NextResponse.json({ ok: true });
}
