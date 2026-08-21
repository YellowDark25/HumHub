export type AdminProfileFieldKind =
  | "text"
  | "textarea"
  | "number"
  | "select"
  | "date"
  | "datetime"
  | "birthday"
  | "country"
  | "markdown"
  | "checkbox"
  | "checkboxList"
  | "userEmail"
  | "userName"
  | "userMemberSince"
  | "userLastLogin"
  | "userGroups"
  | "template"
  | "other";

export type AdminProfileFieldType = {
  id: AdminProfileFieldKind;
  label: string;
};

export type AdminProfileField = {
  id: number;
  categoryId: number;
  internalName: string;
  title: string;
  description: string;
  kind: AdminProfileFieldKind;
  kindLabel: string;
  sortOrder: number;
  isRequired: boolean;
  isVisible: boolean;
  isEditable: boolean;
  isSearchable: boolean;
  showAtRegistration: boolean;
  isSystem: boolean;
  isVirtual: boolean;
  canDelete: boolean;
};

export type AdminProfileCategory = {
  id: number;
  title: string;
  description: string;
  sortOrder: number;
  isSystem: boolean;
  canDelete: boolean;
  fields: AdminProfileField[];
};

export type AdminProfileCatalog = {
  categories: AdminProfileCategory[];
  fieldTypes: AdminProfileFieldType[];
};

export type AdminProfileCategoryInput = {
  title: string;
  description: string;
  sortOrder: number;
};

export type AdminProfileFieldInput = {
  categoryId: number;
  title: string;
  internalName: string;
  description: string;
  kind: AdminProfileFieldKind | "";
  sortOrder: number;
  isRequired: boolean;
  isVisible: boolean;
  isEditable: boolean;
  isSearchable: boolean;
  showAtRegistration: boolean;
};
