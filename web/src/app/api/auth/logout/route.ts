import { NextResponse } from "next/server";
import { clearAuthToken } from "@/infrastructure/session";
import { redirect } from "next/navigation";

export async function POST() {
  await clearAuthToken();
  return NextResponse.json({ ok: true });
}

export async function GET() {
  await clearAuthToken();
  redirect("/login");
}
