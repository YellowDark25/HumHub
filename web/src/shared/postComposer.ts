import { CHAT_FILE_ACCEPT } from "./chatComposer";

export const POST_FILE_ACCEPT = "image/jpeg,image/png,.jpg,.jpeg,.png";
export const SPACE_FILE_ACCEPT = CHAT_FILE_ACCEPT;
export const POST_FILE_MAX_COUNT = 10;
export const POST_FILE_MAX_BYTES = 20 * 1024 * 1024;
export const SPACE_FILE_DESCRIPTION_MAX = 500;

const POST_IMAGE_TYPES = new Set(["image/jpeg", "image/jpg", "image/png"]);
const POST_IMAGE_NAME = /\.(jpe?g|png)$/i;

/**
 * Diz se o arquivo pode ir no feed do espaço (só JPEG, JPG ou PNG).
 * Aceita esses MIME types ou a extensão correspondente quando o tipo vem vazio.
 */
export function isPostImageFile(file: File): boolean {
  if (file.type) {
    return POST_IMAGE_TYPES.has(file.type);
  }
  return POST_IMAGE_NAME.test(file.name);
}
