import type { AdminProfileRepository } from "@/application/ports/AdminProfileRepository";
import type {
  AdminProfileCatalog,
  AdminProfileCategory,
  AdminProfileCategoryInput,
  AdminProfileField,
  AdminProfileFieldInput,
} from "@/domain/AdminProfile";
import { humhubRequest } from "./client";
import {
  mapAdminProfileCatalog,
  mapAdminProfileCategory,
  mapAdminProfileField,
} from "./mappers";
import type {
  HumhubAdminProfileCatalog,
  HumhubAdminProfileCategory,
  HumhubAdminProfileField,
} from "./types";

export class HumhubAdminProfileRepository implements AdminProfileRepository {
  async listCatalog(token: string): Promise<AdminProfileCatalog> {
    const dto = await humhubRequest<HumhubAdminProfileCatalog>({
      path: "/nexchat/admin/profile-fields",
      token,
      origin: "app",
    });

    return mapAdminProfileCatalog(dto);
  }

  async getCategory(
    token: string,
    categoryId: number,
  ): Promise<AdminProfileCategory> {
    const dto = await humhubRequest<HumhubAdminProfileCategory>({
      path: `/nexchat/admin/profile-fields/category?id=${categoryId}`,
      token,
      origin: "app",
    });

    return mapAdminProfileCategory(dto);
  }

  async createCategory(
    token: string,
    input: AdminProfileCategoryInput,
  ): Promise<AdminProfileCategory> {
    return this.saveCategory(token, input);
  }

  async updateCategory(
    token: string,
    categoryId: number,
    input: AdminProfileCategoryInput,
  ): Promise<AdminProfileCategory> {
    return this.saveCategory(token, input, categoryId);
  }

  async deleteCategory(token: string, categoryId: number): Promise<void> {
    await humhubRequest<unknown>({
      path: `/nexchat/admin/profile-fields/delete-category?id=${categoryId}`,
      token,
      origin: "app",
      method: "POST",
    });
  }

  async getField(token: string, fieldId: number): Promise<AdminProfileField> {
    const dto = await humhubRequest<HumhubAdminProfileField>({
      path: `/nexchat/admin/profile-fields/field?id=${fieldId}`,
      token,
      origin: "app",
    });

    return mapAdminProfileField(dto);
  }

  async createField(
    token: string,
    input: AdminProfileFieldInput,
  ): Promise<AdminProfileField> {
    return this.saveField(token, input);
  }

  async updateField(
    token: string,
    fieldId: number,
    input: AdminProfileFieldInput,
  ): Promise<AdminProfileField> {
    return this.saveField(token, input, fieldId);
  }

  async deleteField(token: string, fieldId: number): Promise<void> {
    await humhubRequest<unknown>({
      path: `/nexchat/admin/profile-fields/delete-field?id=${fieldId}`,
      token,
      origin: "app",
      method: "POST",
    });
  }

  private async saveCategory(
    token: string,
    input: AdminProfileCategoryInput,
    categoryId?: number,
  ): Promise<AdminProfileCategory> {
    const dto = await humhubRequest<HumhubAdminProfileCategory>({
      path: "/nexchat/admin/profile-fields/save-category",
      token,
      origin: "app",
      method: "POST",
      body: {
        ...(categoryId ? { id: categoryId } : {}),
        ...input,
      },
    });

    return mapAdminProfileCategory(dto);
  }

  private async saveField(
    token: string,
    input: AdminProfileFieldInput,
    fieldId?: number,
  ): Promise<AdminProfileField> {
    const dto = await humhubRequest<HumhubAdminProfileField>({
      path: "/nexchat/admin/profile-fields/save-field",
      token,
      origin: "app",
      method: "POST",
      body: {
        ...(fieldId ? { id: fieldId } : {}),
        ...input,
      },
    });

    return mapAdminProfileField(dto);
  }
}
