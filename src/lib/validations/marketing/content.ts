import { z } from "zod";
import { COPY_MAX_LENGTH, ASSET_LIMITS } from "@/lib/constants/marketing";
import { captionLength, isCaptionWithinLimit } from "@/lib/marketing/caption";
import type { ContentType } from "@/types/marketing";

export const contentTypeEnum = z.enum([
  "imagem",
  "video",
  "carrossel",
  "reels",
  "story",
  "texto",
  "link",
]);

export const postStatusEnum = z.enum([
  "rascunho",
  "agendado",
  "publicando",
  "publicado",
  "falhou",
  "cancelado",
]);

const hashtagsSchema = z
  .array(z.string().regex(/^[A-Za-z0-9_]+$/))
  .max(30)
  .optional();

const postFieldsSchema = z.object({
  campaign_id: z.string().uuid().nullable().optional(),
  platform_id: z.string().uuid(),
  credential_id: z.string().uuid().optional(),
  title: z.string().min(3).max(200),
  content_type: contentTypeEnum,
  copy: z.string().max(COPY_MAX_LENGTH).optional(),
  hashtags: hashtagsSchema,
  cta_url: z.union([z.string().url(), z.literal("")]).optional(),
  scheduled_at: z.coerce.date(),
  assigned_to: z.string().uuid().nullable().optional(),
});

function refineCaption<T extends { copy?: string; hashtags?: string[] }>(
  schema: z.ZodType<T>,
) {
  return schema.superRefine((data, ctx) => {
    if (!isCaptionWithinLimit(data.copy, data.hashtags)) {
      ctx.addIssue({
        code: "custom",
        message: `Legenda final excede ${COPY_MAX_LENGTH} caracteres (atual: ${captionLength(data.copy, data.hashtags)})`,
        path: ["copy"],
      });
    }
  });
}

export const createPostSchema = refineCaption(postFieldsSchema);

export const updatePostSchema = refineCaption(
  postFieldsSchema.partial().extend({
    id: z.string().uuid(),
  }),
);

export const changeStatusSchema = z.object({
  id: z.string().uuid(),
  to_status: postStatusEnum,
});

export const createCampaignSchema = z
  .object({
    name: z.string().min(3).max(120),
    description: z.string().max(500).optional(),
    start_date: z.coerce.date().optional(),
    end_date: z.coerce.date().optional(),
    color: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/)
      .optional(),
  })
  .refine((d) => !d.start_date || !d.end_date || d.end_date >= d.start_date, {
    message: "Data final deve ser maior ou igual à inicial",
    path: ["end_date"],
  });

export const reschedulePostSchema = z.object({
  id: z.string().uuid(),
  scheduled_at: z.coerce.date().refine((d) => d > new Date(), {
    message: "O agendamento deve ser no futuro",
  }),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type ChangeStatusInput = z.infer<typeof changeStatusSchema>;
export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;

export function validateAssetForPlatform(
  platformSlug: string,
  contentType: ContentType,
  file: { size: number; mimeType: string; durationSec?: number },
): { valid: true } | { valid: false; error: string } {
  const limits = ASSET_LIMITS[platformSlug]?.[contentType];
  if (!limits || limits.maxBytes === 0) {
    return { valid: true };
  }
  if (file.size > limits.maxBytes) {
    const mb = Math.round(limits.maxBytes / (1024 * 1024));
    return {
      valid: false,
      error: `Arquivo excede ${mb} MB para ${platformSlug}/${contentType}`,
    };
  }
  if (
    limits.maxDurationSec &&
    file.durationSec != null &&
    file.durationSec > limits.maxDurationSec
  ) {
    return {
      valid: false,
      error: `Duração máxima: ${limits.maxDurationSec}s`,
    };
  }
  return { valid: true };
}

export function requiresCopyForPublish(contentType: ContentType): boolean {
  return ["imagem", "video", "carrossel", "reels", "story"].includes(contentType);
}
