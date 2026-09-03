import type { AppRelease } from "@/domain/AppRelease";

/**
 * Porta da versão publicada do frontend.
 * Devolve o id do build atual; sem I/O de HumHub ou Nexchat.
 */
export interface AppReleaseRepository {
  getCurrent(): AppRelease;
}
