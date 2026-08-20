import { NextResponse } from "next/server";
import { ApplicationError } from "@/application/errors";

export function jsonError(
  error: unknown,
  fallback = "Erro inesperado.",
): NextResponse {
  if (error instanceof ApplicationError) {
    return NextResponse.json(
      { message: error.message },
      { status: error.status },
    );
  }

  console.error(fallback, error);
  return NextResponse.json({ message: fallback }, { status: 502 });
}
