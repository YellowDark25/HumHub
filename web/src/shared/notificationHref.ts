export const SPACE_INVITE_NOTICE_MARK = "convidou você para o espaço";

export function notificationHref(text: string) {
  if (text.includes(SPACE_INVITE_NOTICE_MARK)) {
    return "/perfil?secao=convites";
  }

  return "/notificacoes";
}
