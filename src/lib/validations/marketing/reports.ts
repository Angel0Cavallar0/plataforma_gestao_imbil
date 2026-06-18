import { z } from "zod";

/** URL do webhook do n8n — https obrigatório (Seção 9.2). */
export const reportsWebhookUrlSchema = z
  .string()
  .trim()
  .min(1, "Informe a URL do webhook")
  .url("URL inválida")
  .refine((u) => u.startsWith("https://"), "A URL deve usar https://");

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida (use AAAA-MM-DD)");

/** Período opcional enviado ao webhook (Seção 7.1). */
export const reportPeriodSchema = z
  .object({
    data_inicio: isoDate,
    data_fim: isoDate,
  })
  .refine((p) => p.data_inicio <= p.data_fim, {
    message: "data_inicio deve ser anterior ou igual a data_fim",
    path: ["data_fim"],
  });

export const reportScopeSchema = z.enum([
  "redes_sociais",
  "midia_paga",
  "midia_paga_insights",
]);

export type ReportPeriodInput = z.infer<typeof reportPeriodSchema>;
