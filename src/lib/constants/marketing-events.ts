import type {
  EventCostCategory,
  EventStatus,
  EventType,
  LeadQualification,
  LeadSource,
  StandardFieldKey,
} from "@/types/marketing-events";

export const EVENT_STATUSES: EventStatus[] = [
  "negociacao",
  "confirmado",
  "em_preparacao",
  "realizado",
  "cancelado",
];

export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  negociacao: "Negociação",
  confirmado: "Confirmado",
  em_preparacao: "Em preparação",
  realizado: "Realizado",
  cancelado: "Cancelado",
};

/** Transições válidas do Kanban (Seção 5.1 da spec). */
export const EVENT_STATUS_TRANSITIONS: Record<EventStatus, EventStatus[]> = {
  negociacao: ["confirmado", "cancelado"],
  confirmado: ["em_preparacao", "cancelado"],
  em_preparacao: ["realizado", "cancelado"],
  realizado: [],
  cancelado: ["negociacao"],
};

export const EVENT_TYPES: EventType[] = [
  "feira",
  "congresso",
  "exposicao",
  "workshop",
  "evento_proprio",
  "outro",
];

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  feira: "Feira",
  congresso: "Congresso",
  exposicao: "Exposição",
  workshop: "Workshop",
  evento_proprio: "Evento próprio",
  outro: "Outro",
};

export const EVENT_COST_CATEGORIES: EventCostCategory[] = [
  "inscricao",
  "estande",
  "material",
  "viagem",
  "hospedagem",
  "equipe",
  "brindes",
  "midia",
  "frete",
  "outro",
];

export const EVENT_COST_CATEGORY_LABELS: Record<EventCostCategory, string> = {
  inscricao: "Inscrição",
  estande: "Estande",
  material: "Material",
  viagem: "Viagem",
  hospedagem: "Hospedagem",
  equipe: "Equipe",
  brindes: "Brindes",
  midia: "Mídia",
  frete: "Frete",
  outro: "Outro",
};

export const LEAD_QUALIFICATIONS: LeadQualification[] = [
  "quente",
  "morno",
  "frio",
  "nao_qualificado",
];

export const LEAD_QUALIFICATION_LABELS: Record<LeadQualification, string> = {
  quente: "Quente",
  morno: "Morno",
  frio: "Frio",
  nao_qualificado: "Não qualificado",
};

export const LEAD_SOURCES: LeadSource[] = [
  "form_publico",
  "cadastro_manual",
  "importacao",
  "qr_code",
  "sorteio",
];

export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  form_publico: "Form público",
  cadastro_manual: "Cadastro manual",
  importacao: "Importação",
  qr_code: "QR Code",
  sorteio: "Sorteio",
};

/** Campos padrão opcionais do builder (toggle on/off). */
export const STANDARD_FIELD_KEYS: StandardFieldKey[] = [
  "company",
  "job_title",
  "city_state",
  "interest",
  "message",
];

export const STANDARD_FIELD_LABELS: Record<StandardFieldKey, string> = {
  company: "Empresa",
  job_title: "Cargo",
  city_state: "Cidade/UF",
  interest: "Área de interesse",
  message: "Mensagem",
};

export const CUSTOM_FIELD_TYPES = [
  "text",
  "textarea",
  "select",
  "radio",
  "checkbox",
  "number",
  "date",
] as const;

export const CUSTOM_FIELD_TYPE_LABELS: Record<
  (typeof CUSTOM_FIELD_TYPES)[number],
  string
> = {
  text: "Texto curto",
  textarea: "Texto longo",
  select: "Seleção (lista)",
  radio: "Escolha única",
  checkbox: "Checkbox",
  number: "Número",
  date: "Data",
};

export const MAX_CUSTOM_FIELDS = 15;

export const QR_BUCKET = "marketing-form-qrcodes";

export const CONSENT_TEXT_VERSION = "v1-2026";

export const CONSENT_TEXT =
  "Autorizo a Imbil a utilizar meus dados de contato para comunicações de marketing, conforme a Política de Privacidade.";

/** Rate limit do form público: máx. de envios por IP na janela. */
export const PUBLIC_SUBMISSION_RATE_LIMIT = 5;
export const PUBLIC_SUBMISSION_RATE_WINDOW_MIN = 10;

export function publicFormUrl(slug: string, token: string): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "https://plataforma.imbil.com.br";
  return `${base.replace(/\/$/, "")}/f/${slug}?t=${token}`;
}
