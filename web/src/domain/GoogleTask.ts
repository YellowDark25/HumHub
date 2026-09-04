/** Tarefa do Google Tasks do usuário. */
export type GoogleTask = {
  id: string;
  title: string;
  notes: string;
  due: string | null;
  isCompleted: boolean;
};
