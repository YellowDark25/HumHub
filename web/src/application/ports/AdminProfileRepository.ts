import type {
  AdminProfileCatalog,
  AdminProfileCategory,
  AdminProfileCategoryInput,
  AdminProfileField,
  AdminProfileFieldInput,
} from "@/domain/AdminProfile";

export interface AdminProfileRepository {
  listCatalog(token: string): Promise<AdminProfileCatalog>;
  getCategory(token: string, categoryId: number): Promise<AdminProfileCategory>;
  createCategory(
    token: string,
    input: AdminProfileCategoryInput,
  ): Promise<AdminProfileCategory>;
  updateCategory(
    token: string,
    categoryId: number,
    input: AdminProfileCategoryInput,
  ): Promise<AdminProfileCategory>;
  deleteCategory(token: string, categoryId: number): Promise<void>;
  getField(token: string, fieldId: number): Promise<AdminProfileField>;
  createField(
    token: string,
    input: AdminProfileFieldInput,
  ): Promise<AdminProfileField>;
  updateField(
    token: string,
    fieldId: number,
    input: AdminProfileFieldInput,
  ): Promise<AdminProfileField>;
  deleteField(token: string, fieldId: number): Promise<void>;
}
