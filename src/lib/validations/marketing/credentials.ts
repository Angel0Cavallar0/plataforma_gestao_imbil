import { z } from "zod";

export const saveMetaCredentialsSchema = z.object({
  platform_id: z.string().uuid(),
  label: z.string().min(3).max(120),
  app_id: z.string().regex(/^\d+$/),
  app_secret: z.string().min(20),
  facebook_page_id: z.string().regex(/^\d+$/),
  instagram_user_id: z.string().regex(/^\d+$/),
  system_user_token: z.string().min(50),
  scopes: z.array(z.string()).optional(),
});

export const rotateMetaTokenSchema = z.object({
  credential_id: z.string().uuid(),
  system_user_token: z.string().min(50),
});

export type SaveMetaCredentialsInput = z.infer<typeof saveMetaCredentialsSchema>;
export type RotateMetaTokenInput = z.infer<typeof rotateMetaTokenSchema>;
