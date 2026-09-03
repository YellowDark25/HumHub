import { ApplicationError } from "../errors";
import type { AppReleaseRepository } from "../ports/AppReleaseRepository";

/**
 * Lê a versão publicada do sistema.
 * Pede o id ao repositório e recusa resposta vazia.
 * @returns release com o buildId do deploy atual.
 */
export function getAppRelease(releases: AppReleaseRepository) {
  const release = releases.getCurrent();
  if (!release.buildId.trim()) {
    throw new ApplicationError("Versão do sistema indisponível.", 500);
  }

  return release;
}
