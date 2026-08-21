import type {
  AdminProfileFieldInput,
  AdminProfileFieldKind,
} from "@/domain/AdminProfile";

export function readProfileFieldInput(
  body: Record<string, unknown> | null,
): AdminProfileFieldInput {
  return {
    categoryId: Number(body?.categoryId ?? 0),
    title: stringValue(body?.title),
    internalName: stringValue(body?.internalName),
    description: stringValue(body?.description),
    kind: stringValue(body?.kind) as AdminProfileFieldKind | "",
    sortOrder: Number(body?.sortOrder ?? 100),
    isRequired: Boolean(body?.isRequired),
    isVisible: Boolean(body?.isVisible),
    isEditable: Boolean(body?.isEditable),
    isSearchable: Boolean(body?.isSearchable),
    showAtRegistration: Boolean(body?.showAtRegistration),
  };
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}
