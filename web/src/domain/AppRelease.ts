/**
 * Versão publicada do frontend (id do deploy no Vercel).
 * O cliente compara o id com o que carregou para saber se precisa atualizar.
 */
export type AppRelease = {
  buildId: string;
};

/**
 * Diz se o servidor já está numa versão diferente da que o browser carregou.
 * Ids vazios não contam como atualização (evita falso positivo no boot).
 */
export function hasAppReleaseUpdate(
  loaded: AppRelease,
  latest: AppRelease,
): boolean {
  if (!loaded.buildId || !latest.buildId) {
    return false;
  }

  return loaded.buildId !== latest.buildId;
}
