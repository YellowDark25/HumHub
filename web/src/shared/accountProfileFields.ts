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
