/** Status do vínculo Google visível para o usuário. */
export type GoogleAccountStatus = {
  connected: boolean;
  email: string;
};

/** Credencial Google usada só pelo turno da secretária. */
export type GoogleAccountCredential = {
  userId: number;
  email: string;
  refreshToken: string;
  expiresAt: string | null;
};
