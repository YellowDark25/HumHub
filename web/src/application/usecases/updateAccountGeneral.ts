import type { AccountGeneralPatch } from "@/domain/AccountGeneralSettings";
import { ApplicationError } from "../errors";
import type { AccountSettingsRepository } from "../ports/AccountSettingsRepository";

const EDITOR_MODES = new Set(["rich", "plain"]);

export function updateAccountGeneral(
  settings: AccountSettingsRepository,
  token: string,
  patch: AccountGeneralPatch,
) {
  const language = patch.language?.trim() ?? "";
  const timeZone = patch.timeZone?.trim() ?? "";
  const tags = uniqueTexts(patch.tags);
  const markdownEditorMode = patch.markdownEditorMode;
  const blockedUserIds = uniquePositiveIds(patch.blockedUserIds);

  if (!language) {
    throw new ApplicationError("Informe o idioma.", 400);
  }

  if (!timeZone) {
    throw new ApplicationError("Informe o fuso horário.", 400);
  }

  if (!EDITOR_MODES.has(markdownEditorMode)) {
    throw new ApplicationError("Modo de editor inválido.", 400);
  }

  return settings.save(token, {
    tags,
    language,
    timeZone,
    visibility: Number(patch.visibility) || 1,
    hideOnlineStatus: Boolean(patch.hideOnlineStatus),
    hideTourPanel: Boolean(patch.hideTourPanel),
    markdownEditorMode,
    blockedUserIds,
  });
}

function uniqueTexts(values: string[] | undefined): string[] {
  const unique = new Set<string>();
  for (const value of values ?? []) {
    const trimmed = value.trim();
    if (trimmed) {
      unique.add(trimmed);
    }
  }

  return [...unique];
}

function uniquePositiveIds(ids: number[] | undefined): number[] {
  const unique = new Set<number>();
  for (const id of ids ?? []) {
    if (Number.isFinite(id) && id > 0) {
      unique.add(Math.trunc(id));
    }
  }

  return [...unique];
}
