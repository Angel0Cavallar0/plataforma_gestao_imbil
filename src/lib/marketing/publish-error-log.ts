import { createAdminClient } from "@/lib/supabase/admin";
import { marketingSchema } from "@/lib/supabase/marketing";

/** Ator sintético do cron — não existe em profiles, então não vai em created_by. */
export const CRON_ACTOR_ID = "00000000-0000-0000-0000-000000000000";

export type PostErrorStage = "agendamento" | "publicacao";

/**
 * Grava um log de erro de agendamento/publicação. Nunca lança: o registro
 * do erro não pode quebrar o fluxo que o originou.
 */
export async function logPostError(entry: {
  postId: string;
  stage: PostErrorStage;
  message: string;
  code?: string | null;
  attempt?: number | null;
  userId?: string | null;
}): Promise<void> {
  try {
    const admin = createAdminClient();
    const { error } = await marketingSchema(admin)
      .from("content_post_error_logs")
      .insert({
        post_id: entry.postId,
        stage: entry.stage,
        source: "app",
        error_message: entry.message,
        error_code: entry.code ?? null,
        attempt: entry.attempt ?? null,
        created_by:
          entry.userId && entry.userId !== CRON_ACTOR_ID ? entry.userId : null,
      });
    if (error) {
      console.error(
        `Falha ao gravar log de erro do post ${entry.postId}: ${error.message}`,
      );
    }
  } catch (e) {
    console.error(`Falha ao gravar log de erro do post ${entry.postId}:`, e);
  }
}
