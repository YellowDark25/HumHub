export const SPACE_INVITE_NOTICE_MARK = "convidou você para o espaço";
export const FRIENDSHIP_NOTICE_MARKS = [
  "pedido de amizade",
  "solicitação de amizade",
  "agora é seu amigo",
  "aceitou seu pedido",
];
export const CHAT_NOTICE_MARKS = [
  "te enviou uma mensagem",
  "enviou uma mensagem em",
  "convidou você para o canal",
];

export function notificationHref(text: string) {
  if (text.includes(SPACE_INVITE_NOTICE_MARK)) {
    return "/perfil?secao=convites";
  }

  if (CHAT_NOTICE_MARKS.some((mark) => text.includes(mark))) {
    return "/chat";
  }

  if (FRIENDSHIP_NOTICE_MARKS.some((mark) => text.toLowerCase().includes(mark))) {
    return "/pessoas";
  }

  return "/notificacoes";
}
