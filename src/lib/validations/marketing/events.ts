import { z } from "zod";
import { MAX_CUSTOM_FIELDS } from "@/lib/constants/marketing-events";

export const eventStatusEnum = z.enum([
  "negociacao",
  "confirmado",
  "em_preparacao",
  "realizado",
  "cancelado",
]);

export const qualificationEnum = z.enum(["quente", "morno", "frio", "nao_qualificado"]);

const eventFieldsSchema = z.object({
  name: z.string().min(3).max(200),
  edition: z.string().max(40).optional(),
  description: z.string().max(2000).optional(),
  objective: z.string().max(1000).optional(),
  event_type: z.enum([
    "feira",
    "congresso",
    "exposicao",
    "workshop",
    "evento_proprio",
    "outro",
  ]),
  starts_on: z.coerce.date().optional(),
  ends_on: z.coerce.date().optional(),
  venue: z.string().max(200).optional(),
  city: z.string().max(120).optional(),
  state: z.string().max(2).optional(),
  investment_planned: z.coerce.number().nonnegative().optional(),
  investment_actual: z.coerce.number().nonnegative().optional(),
  estimated_value_per_lead: z.coerce.number().nonnegative().optional(),
  notes: z.string().max(2000).optional(),
});

const refineDates = <T extends { starts_on?: Date; ends_on?: Date }>(
  schema: z.ZodType<T>,
) =>
  schema.refine((d) => !d.starts_on || !d.ends_on || d.ends_on >= d.starts_on, {
    message: "Data final deve ser maior ou igual à inicial",
    path: ["ends_on"],
  });

export const createEventSchema = refineDates(eventFieldsSchema);

export const updateEventSchema = refineDates(
  eventFieldsSchema.partial().extend({ id: z.string().uuid() }),
);

export const changeEventStatusSchema = z.object({
  id: z.string().uuid(),
  to_status: eventStatusEnum,
});

export const reorderKanbanSchema = z.object({
  id: z.string().uuid(),
  status: eventStatusEnum,
  new_order: z.number().int().nonnegative(),
});

export const addEventCostSchema = z.object({
  event_id: z.string().uuid(),
  category: z.enum([
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
  ]),
  description: z.string().min(2).max(300),
  amount: z.coerce.number().nonnegative(),
  paid_at: z.coerce.date().optional(),
});

// ---- Builder de formulário ----

export const customFieldSchema = z
  .object({
    key: z
      .string()
      .regex(/^[a-z0-9_]+$/)
      .max(40),
    label: z.string().min(2).max(120),
    type: z.enum(["text", "textarea", "select", "radio", "checkbox", "number", "date"]),
    required: z.boolean().default(false),
    options: z.array(z.string().max(80)).max(12).optional(),
    placeholder: z.string().max(120).optional(),
    order: z.number().int().nonnegative(),
  })
  .refine(
    (f) => !["select", "radio"].includes(f.type) || (f.options && f.options.length >= 2),
    { message: "Select/radio precisam de pelo menos 2 opções", path: ["options"] },
  );

const standardFieldEnum = z.enum([
  "company",
  "job_title",
  "city_state",
  "interest",
  "message",
]);

const leadFormFieldsSchema = z.object({
  event_id: z.string().uuid(),
  name: z.string().min(3).max(150),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/)
    .min(3)
    .max(80),
  description: z.string().max(1000).optional(),
  standard_fields: z.array(standardFieldEnum).default([]),
  interest_options: z.array(z.string().max(80)).max(20).default([]),
  custom_fields: z.array(customFieldSchema).max(MAX_CUSTOM_FIELDS).default([]),
  expires_at: z.coerce.date(),
  privacy_policy_text: z.string().max(20000).optional(),
  privacy_policy_url: z.string().url().optional().or(z.literal("")),
  is_active: z.boolean().default(false),
});

function refineLeadForm<T extends z.infer<typeof leadFormFieldsSchema>>(
  schema: z.ZodType<T>,
) {
  return schema
    .refine(
      (f) => {
        const keys = f.custom_fields.map((c) => c.key);
        return new Set(keys).size === keys.length;
      },
      { message: "Chaves de campos duplicadas", path: ["custom_fields"] },
    )
    .refine((f) => !f.is_active || !!f.privacy_policy_text || !!f.privacy_policy_url, {
      message:
        "Para ativar o formulário, preencha a política de privacidade (texto ou URL)",
      path: ["privacy_policy_text"],
    });
}

export const createLeadFormSchema = refineLeadForm(
  leadFormFieldsSchema.extend({
    expires_at: z.coerce.date().refine((d) => d > new Date(), {
      message: "A expiração deve ser no futuro",
    }),
  }),
);

export const updateLeadFormSchema = refineLeadForm(
  leadFormFieldsSchema.extend({ id: z.string().uuid() }),
);

export const extendExpirationSchema = z.object({
  id: z.string().uuid(),
  expires_at: z.coerce.date().refine((d) => d > new Date(), {
    message: "A expiração deve ser no futuro",
  }),
});

// ---- Submissão pública ----

export const publicSubmissionSchema = z
  .object({
    slug: z.string().regex(/^[a-z0-9-]+$/),
    token: z.string().uuid(),
    full_name: z.string().min(3).max(150),
    email: z.string().email().max(200).optional().or(z.literal("")),
    phone: z
      .string()
      .regex(/^[0-9()+\-\s]{8,20}$/)
      .optional()
      .or(z.literal("")),
    company: z.string().max(150).optional(),
    job_title: z.string().max(100).optional(),
    city: z.string().max(120).optional(),
    state: z.string().max(2).optional(),
    interest: z.string().max(100).optional(),
    message: z.string().max(1000).optional(),
    custom_answers: z.record(z.string(), z.string().max(500)).default({}),
    marketing_consent: z.boolean(),
    website: z.string().optional(), // honeypot — preenchido = bot
  })
  .refine((d) => (d.email && d.email.length > 0) || (d.phone && d.phone.length > 0), {
    message: "Informe e-mail ou telefone",
    path: ["email"],
  });

// As respostas em custom_answers são validadas dinamicamente no Route Handler
// contra o custom_fields do formulário (tipo, required, options válidas).

// ---- Leads ----

export const createLeadManualSchema = z
  .object({
    event_id: z.string().uuid(),
    full_name: z.string().min(3).max(150),
    email: z.string().email().max(200).optional().or(z.literal("")),
    phone: z
      .string()
      .regex(/^[0-9()+\-\s]{8,20}$/)
      .optional()
      .or(z.literal("")),
    company: z.string().max(150).optional(),
    job_title: z.string().max(100).optional(),
    city: z.string().max(120).optional(),
    state: z.string().max(2).optional(),
    interest: z.string().max(100).optional(),
    message: z.string().max(1000).optional(),
    marketing_consent: z.boolean().default(false),
  })
  .refine((d) => (d.email && d.email.length > 0) || (d.phone && d.phone.length > 0), {
    message: "Informe e-mail ou telefone",
    path: ["email"],
  });

export const qualifyLeadSchema = z.object({
  id: z.string().uuid(),
  qualification: qualificationEnum,
  notes: z.string().max(500).optional(),
});

export type CreateEventInput = z.input<typeof createEventSchema>;
export type UpdateEventInput = z.input<typeof updateEventSchema>;
export type AddEventCostInput = z.input<typeof addEventCostSchema>;
export type CreateLeadFormInput = z.input<typeof createLeadFormSchema>;
export type UpdateLeadFormInput = z.input<typeof updateLeadFormSchema>;
export type PublicSubmissionInput = z.input<typeof publicSubmissionSchema>;
export type CreateLeadManualInput = z.input<typeof createLeadManualSchema>;
export type QualifyLeadInput = z.input<typeof qualifyLeadSchema>;
