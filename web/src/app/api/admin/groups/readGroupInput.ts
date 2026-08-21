import type { AdminGroupInput } from "@/domain/AdminGroup";

export function readGroupInput(
  body: Record<string, unknown> | null,
): AdminGroupInput {
  return {
    name: stringValue(body?.name),
    description: stringValue(body?.description),
    showAtDirectory: Boolean(body?.showAtDirectory),
    showAtRegistration: Boolean(body?.showAtRegistration),
    notifyUsers: Boolean(body?.notifyUsers),
    isDefault: Boolean(body?.isDefault),
    sortOrder: Number(body?.sortOrder ?? 100),
  };
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}
