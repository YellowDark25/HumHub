export type NotificationCategory = {
  id: string;
  label: string;
};

export const NOTIFICATION_CATEGORIES: NotificationCategory[] = [
  { id: "admin", label: "Administrativo" },
  { id: "like", label: "Curtidas" },
  { id: "comments", label: "Comentários" },
  { id: "space_member", label: "Membros do Espaço" },
  { id: "space_created", label: "Novo Espaço" },
  { id: "followed", label: "Seguindo" },
  { id: "mentioned", label: "Menções" },
  { id: "content_created", label: "Novo Conteúdo" },
  { id: "nexchat", label: "Chat" },
  { id: "mail", label: "Mensagem" },
  { id: "mail_conversation", label: "Conversação" },
  { id: "task", label: "Tarefas" },
  { id: "task_reminder", label: "Tarefas: Lembrete" },
  { id: "others-no-category", label: "Outros" },
];

export const ALL_NOTIFICATION_CATEGORY_IDS = NOTIFICATION_CATEGORIES.map(
  (category) => category.id,
);
