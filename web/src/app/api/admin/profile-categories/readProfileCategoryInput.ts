import type { AdminProfileCategoryInput } from "@/domain/AdminProfile";

export function readProfileCategoryInput(
  body: Record<string, unknown> | null,
): AdminProfileCategoryInput {
  return {
    title: stringValue(body?.title),
    description: stringValue(body?.description),
    sortOrder: Number(body?.sortOrder ?? 100),
  };
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}
