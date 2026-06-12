export type EventStatus =
  | "negociacao"
  | "confirmado"
  | "em_preparacao"
  | "realizado"
  | "cancelado";

export type EventType =
  | "feira"
  | "congresso"
  | "exposicao"
  | "workshop"
  | "evento_proprio"
  | "outro";

export type EventCostCategory =
  | "inscricao"
  | "estande"
  | "material"
  | "viagem"
  | "hospedagem"
  | "equipe"
  | "brindes"
  | "midia"
  | "frete"
  | "outro";

export type LeadQualification = "quente" | "morno" | "frio" | "nao_qualificado";

export type LeadSource =
  | "form_publico"
  | "cadastro_manual"
  | "importacao"
  | "qr_code"
  | "sorteio";

export type StandardFieldKey =
  | "company"
  | "job_title"
  | "city_state"
  | "interest"
  | "message";

export type CustomFieldType =
  | "text"
  | "textarea"
  | "select"
  | "radio"
  | "checkbox"
  | "number"
  | "date";

export type CustomField = {
  key: string;
  label: string;
  type: CustomFieldType;
  required: boolean;
  options?: string[];
  placeholder?: string;
  order: number;
};

export type MarketingEvent = {
  id: string;
  name: string;
  edition: string | null;
  description: string | null;
  objective: string | null;
  event_type: EventType;
  starts_on: string | null;
  ends_on: string | null;
  venue: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  status: EventStatus;
  kanban_order: number;
  investment_planned: number | null;
  investment_actual: number | null;
  currency: string;
  estimated_value_per_lead: number | null;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type EventKanbanCardData = MarketingEvent & {
  leads_count: number;
  active_forms_count: number;
  costs_total: number;
};

export type EventCost = {
  id: string;
  event_id: string;
  category: EventCostCategory;
  description: string;
  amount: number;
  paid_at: string | null;
  created_by: string | null;
  created_at: string;
};

export type EventStatusHistoryEntry = {
  id: string;
  event_id: string;
  from_status: EventStatus | null;
  to_status: EventStatus;
  changed_by: string | null;
  notes: string | null;
  created_at: string;
  changed_by_profile?: { full_name: string } | null;
};

export type LeadForm = {
  id: string;
  event_id: string;
  name: string;
  slug: string;
  description: string | null;
  custom_fields: CustomField[];
  standard_fields: StandardFieldKey[];
  interest_options: string[];
  is_active: boolean;
  public_token: string;
  expires_at: string;
  qr_code_path: string | null;
  consent_text_version: string;
  privacy_policy_text: string | null;
  privacy_policy_url: string | null;
  submissions_count: number;
  last_submission_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type LeadFormWithEvent = LeadForm & {
  event: { id: string; name: string; edition: string | null } | null;
};

/** Versão pública do formulário — sem token nem metadados internos. */
export type PublicLeadFormData = {
  id: string;
  name: string;
  description: string | null;
  custom_fields: CustomField[];
  standard_fields: StandardFieldKey[];
  interest_options: string[];
  consent_text_version: string;
  privacy_policy_text: string | null;
  privacy_policy_url: string | null;
  event_name: string;
};

export type EventLead = {
  id: string;
  event_id: string;
  lead_form_id: string | null;
  full_name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  job_title: string | null;
  city: string | null;
  state: string | null;
  interest: string | null;
  message: string | null;
  custom_answers: Record<string, string>;
  marketing_consent: boolean;
  marketing_consent_at: string | null;
  consent_text_version: string | null;
  source: LeadSource;
  captured_by: string | null;
  qualification: LeadQualification | null;
  qualified_by: string | null;
  qualified_at: string | null;
  qualification_notes: string | null;
  forwarded_to_sales: boolean;
  forwarded_at: string | null;
  created_at: string;
  updated_at: string;
};

export type EventLeadWithRelations = EventLead & {
  event: { id: string; name: string; edition: string | null } | null;
  lead_form: { id: string; name: string; custom_fields: CustomField[] } | null;
};

export type LeadKpis = {
  total: number;
  qualified: number;
  consentRate: number;
  forwarded: number;
};

export type LeadFilters = {
  event?: string;
  form?: string;
  qualification?: string;
  source?: string;
  consent?: string;
  from?: string;
  to?: string;
  q?: string;
};

export type EventRoiRow = {
  id: string;
  name: string;
  edition: string | null;
  starts_on: string | null;
  city: string | null;
  state: string | null;
  event_type: EventType;
  investment: number | null;
  leads_total: number;
  leads_qualified: number;
  leads_with_consent: number;
  leads_forwarded: number;
  estimated_value_per_lead: number | null;
  roi_estimated_pct: number | null;
};
