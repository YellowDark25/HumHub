import type { AppReleaseRepository } from "@/application/ports/AppReleaseRepository";
import type { AppRelease } from "@/domain/AppRelease";

/**
 * Lê o id do deploy nas variáveis do Vercel (ou "dev" no ambiente local).
 * Prefere VERCEL_DEPLOYMENT_ID para um redeploy do mesmo commit também avisar.
 */
export class EnvAppReleaseRepository implements AppReleaseRepository {
  /**
   * Devolve o buildId do processo atual.
   * Encadeia as envs do Vercel e cai em "dev" quando nenhuma existe.
   */
  getCurrent(): AppRelease {
    return { buildId: readDeployBuildId() };
  }
}

/**
 * Escolhe o identificador mais específico do deploy.
 * Deployment id muda a cada publicação; o SHA só muda com commit novo.
 */
function readDeployBuildId(): string {
  return (
    process.env.VERCEL_DEPLOYMENT_ID?.trim() ||
    process.env.VERCEL_GIT_COMMIT_SHA?.trim() ||
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.trim() ||
    "dev"
  );
}
