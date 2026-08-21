import type {
  AdminProfileFieldInput,
  AdminProfileFieldKind,
} from "@/domain/AdminProfile";
import { ApplicationError } from "../errors";

const DEFAULT_SORT_ORDER = 100;
const INTERNAL_NAME = /^[a-z][a-z0-9_]*$/;
const CREATABLE_KINDS = new Set<AdminProfileFieldKind>([
  "text",
  "textarea",
  "number",
  "select",
  "date",
  "datetime",
  "birthday",
  "country",
  "markdown",
  "checkbox",
  "checkboxList",
]);

export function readAdminProfileFieldInput(
  input: AdminProfileFieldInput,
  mode: "create" | "update",
): AdminProfileFieldInput {
  const title = input.title.trim();
  if (!title) {
    throw new ApplicationError("Informe o título do campo.", 400);
  }

  if (!Number.isFinite(input.categoryId) || input.categoryId <= 0) {
    throw new ApplicationError("Informe uma categoria válida.", 400);
  }

  const sortOrder = Number.isFinite(input.sortOrder)
    ? Math.trunc(input.sortOrder)
    : DEFAULT_SORT_ORDER;

  return {
    categoryId: input.categoryId,
    title,
    internalName: readInternalName(input.internalName, mode),
    description: input.description.trim(),
    kind: readKind(input.kind, mode),
    sortOrder: sortOrder > 0 ? sortOrder : DEFAULT_SORT_ORDER,
    isRequired: Boolean(input.isRequired),
    isVisible: Boolean(input.isVisible),
    isEditable: Boolean(input.isEditable),
    isSearchable: Boolean(input.isSearchable),
    showAtRegistration: Boolean(input.showAtRegistration),
  };
}

function readInternalName(value: string, mode: "create" | "update") {
  const internalName = value.trim().toLowerCase();
  if (mode === "update") {
    return internalName;
  }

  if (!INTERNAL_NAME.test(internalName)) {
    throw new ApplicationError(
      "O nome interno deve começar com letra e usar só letras, números ou underline.",
      400,
    );
  }

  return internalName;
}

function readKind(
  value: AdminProfileFieldKind | "",
  mode: "create" | "update",
): AdminProfileFieldKind | "" {
  if (mode === "update") {
    return value;
  }

  if (!value || !CREATABLE_KINDS.has(value)) {
    throw new ApplicationError("Escolha um tipo de campo válido.", 400);
  }

  return value;
}
