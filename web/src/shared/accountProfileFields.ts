import type { AccountProfile } from "@/domain/Account";

export type AccountFieldKind = "text" | "select" | "date" | "textarea";

export type AccountProfileField = {
  key: keyof AccountProfile;
  label: string;
  required?: boolean;
  kind?: AccountFieldKind;
  options?: { value: string; label: string }[];
};

export type AccountProfileCategory = {
  id: "geral" | "comunicacao" | "redes";
  label: string;
  fields: AccountProfileField[];
};

export const ACCOUNT_PROFILE_CATEGORIES: AccountProfileCategory[] = [
  {
    id: "geral",
    label: "Geral",
    fields: [
      { key: "firstName", label: "Primeiro nome", required: true },
      { key: "lastName", label: "Último nome", required: true },
      { key: "title", label: "Título" },
      {
        key: "gender",
        label: "Gênero",
        kind: "select",
        options: [
          { value: "", label: "Selecione:" },
          { value: "male", label: "Masculino" },
          { value: "female", label: "Feminino" },
          { value: "diverse", label: "Diverso" },
        ],
      },
      { key: "street", label: "Endereço" },
      { key: "zip", label: "CEP" },
      { key: "city", label: "Cidade" },
      { key: "country", label: "País" },
      { key: "state", label: "Estado" },
      { key: "birthday", label: "Data de nascimento", kind: "date" },
      { key: "about", label: "Sobre mim", kind: "textarea" },
    ],
  },
  {
    id: "comunicacao",
    label: "Comunicação",
    fields: [
      { key: "phonePrivate", label: "Telefone particular" },
      { key: "phoneWork", label: "Telefone comercial" },
      { key: "mobile", label: "Celular" },
      { key: "fax", label: "Fax" },
      { key: "skype", label: "Skype" },
      { key: "xmpp", label: "XMPP / Jabber" },
      { key: "website", label: "Website" },
    ],
  },
  {
    id: "redes",
    label: "Redes sociais",
    fields: [
      { key: "facebook", label: "Facebook URL" },
      { key: "linkedin", label: "LinkedIn URL" },
      { key: "xing", label: "Xing URL" },
      { key: "youtube", label: "YouTube URL" },
      { key: "vimeo", label: "Vimeo URL" },
      { key: "flickr", label: "Flickr URL" },
      { key: "myspace", label: "MySpace URL" },
      { key: "twitter", label: "Twitter URL" },
    ],
  },
];

export const ACCOUNT_LANGUAGES = [
  { value: "pt", label: "Português" },
  { value: "pt-BR", label: "Português (Brasil)" },
  { value: "en-US", label: "English" },
  { value: "es", label: "Español" },
  { value: "de", label: "Deutsch" },
] as const;

export const ACCOUNT_TIME_ZONES = [
  { value: "America/Sao_Paulo", label: "América/São Paulo" },
  { value: "America/Manaus", label: "América/Manaus" },
  { value: "America/Recife", label: "América/Recife" },
  { value: "America/Fortaleza", label: "América/Fortaleza" },
  { value: "America/Belem", label: "América/Belém" },
  { value: "America/Cuiaba", label: "América/Cuiabá" },
  { value: "America/Porto_Velho", label: "América/Porto Velho" },
  { value: "America/Rio_Branco", label: "América/Rio Branco" },
  { value: "America/Noronha", label: "América/Noronha" },
  { value: "UTC", label: "UTC" },
] as const;

export const ACCOUNT_VISIBILITY_OPTIONS = [
  { value: 1, label: "Usuários registrados" },
  { value: 2, label: "Visível para todos" },
  { value: 3, label: "Oculto" },
] as const;

export const ACCOUNT_GENERAL_TITLE = "Geral";

export const ACCOUNT_GENERAL_DESCRIPTION =
  "Defina as configurações básicas para o seu perfil. Você pode adicionar tags adequadas a você, escolher o idioma e seu fuso horário e bloquear usuários indesejados.";

export const ACCOUNT_TAGS_HINT =
  "Adicione tags ao seu perfil descrevendo você e destacando suas habilidades e interesses. Suas tags serão exibidas em seu perfil e no diretório 'Pessoas'.";

export const ACCOUNT_EDITOR_MODES = [
  { value: "rich", label: "Rich Text" },
  { value: "plain", label: "Simples" },
] as const;

export const ACCOUNT_MODULES_TITLE = "Módulos de Perfil";

export const ACCOUNT_MODULES_DESCRIPTION =
  "Semelhante aos Espaços, seu perfil pessoal também permite que você use módulos. Por favor, tenha em mente que as informações que você compartilha em seu perfil estão disponíveis para outros usuários da rede.";

export const ACCOUNT_MODULE_LABELS: Record<
  string,
  { name: string; description: string }
> = {
  cfiles: {
    name: "Arquivos",
    description: "Adicionar o módulo de arquivos no seu perfil.",
  },
  files: {
    name: "Arquivos",
    description: "Adicionar o módulo de arquivos no seu perfil.",
  },
  tasks: {
    name: "Tarefas",
    description:
      "Crie tarefas, atribua pessoas, defina prazos e organize projetos para manter a equipe no ritmo.",
  },
  wiki: {
    name: "Wiki",
    description: "Adicionar uma wiki para este perfil.",
  },
  polls: {
    name: "Enquetes",
    description: "Permitir iniciar enquetes.",
  },
};

export function accountModuleCopy(
  id: string,
  name: string,
  description: string,
) {
  return ACCOUNT_MODULE_LABELS[id] ?? { name, description };
}

export const MAIL_SUMMARY_INTERVALS = [
  { value: "0", label: "Nunca" },
  { value: "1", label: "A cada hora" },
  { value: "2", label: "Diário" },
  { value: "3", label: "Semanal" },
  { value: "4", label: "Mensal" },
] as const;

export const MAIL_SUMMARY_ACTIVITIES = [
  "Novo conteúdo",
  "Comentários",
  "Curtidas",
  "Menções",
  "Novo membro no espaço",
  "Seguindo",
] as const;
