import { z } from "zod";

export const alertRuleTypeEnum = z.enum(["performance", "date"]);
export const alertSeverityEnum = z.enum(["low", "medium", "high", "critical"]);
export const alertDirectionEnum = z.enum(["increase", "decrease", "any"]);
export const alertPeriodWindowEnum = z.enum(["day", "week", "month"]);

const baseFields = z.object({
  name: z.string().min(2).max(120),
  rule_type: alertRuleTypeEnum,
  severity: alertSeverityEnum.default("medium"),
  is_active: z.boolean().default(true),

  // Performance
  source: z.string().max(60).nullable().optional(),
  metric: z.string().max(60).nullable().optional(),
  direction: alertDirectionEnum.nullable().optional(),
  threshold_pct: z.coerce.number().min(0).max(100000).nullable().optional(),
  period_window: alertPeriodWindowEnum.nullable().optional(),

  // Data
  event_date: z
    .union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.literal("")])
    .nullable()
    .optional(),
  remind_days_before: z.coerce.number().int().min(0).max(365).nullable().optional(),
});

/** Valida campos condicionais por tipo de regra. */
function refineRule<T extends z.ZodType<z.infer<typeof baseFields>>>(schema: T) {
  return schema.superRefine((data, ctx) => {
    if (data.rule_type === "performance") {
      if (!data.source)
        ctx.addIssue({
          code: "custom",
          message: "Fonte é obrigatória",
          path: ["source"],
        });
      if (!data.metric)
        ctx.addIssue({
          code: "custom",
          message: "Métrica é obrigatória",
          path: ["metric"],
        });
      if (data.threshold_pct == null)
        ctx.addIssue({
          code: "custom",
          message: "Limite (%) é obrigatório",
          path: ["threshold_pct"],
        });
    } else if (data.rule_type === "date") {
      if (!data.event_date)
        ctx.addIssue({
          code: "custom",
          message: "Data do evento é obrigatória",
          path: ["event_date"],
        });
    }
  });
}

export const createAlertRuleSchema = refineRule(baseFields);

export const updateAlertRuleSchema = refineRule(
  baseFields.extend({ id: z.string().uuid() }),
);

export const toggleAlertRuleSchema = z.object({
  id: z.string().uuid(),
  is_active: z.boolean(),
});

export type CreateAlertRuleInput = z.input<typeof createAlertRuleSchema>;
export type UpdateAlertRuleInput = z.input<typeof updateAlertRuleSchema>;
