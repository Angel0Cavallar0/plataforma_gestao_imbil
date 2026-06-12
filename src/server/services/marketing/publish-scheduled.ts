import { createAdminClient } from "@/lib/supabase/admin";
import { marketingSchema } from "@/lib/supabase/marketing";
import { publishToMeta } from "@/lib/integrations/meta/publish";

const MAX_ATTEMPTS = 3;
const CRON_ACTOR_ID = "00000000-0000-0000-0000-000000000000";

/**
 * Publica os posts agendados vencidos. Usado pela rota /api/cron para testes
 * manuais; produção usa a Edge Function publish-scheduled-posts.
 *
 * Não é uma Server Action de propósito: usa createAdminClient sem checagem de
 * sessão e só pode ser invocada por código de servidor autenticado via CRON_SECRET.
 */
export async function processScheduledPosts() {
  const admin = createAdminClient();
  const now = new Date().toISOString();
  const { data: posts } = await marketingSchema(admin)
    .from("content_posts")
    .select("id, publish_attempts")
    .eq("status", "agendado")
    .lte("scheduled_at", now);

  const results: { id: string; ok: boolean; error?: string }[] = [];
  for (const post of posts ?? []) {
    if ((post.publish_attempts as number) >= MAX_ATTEMPTS) continue;
    try {
      await publishToMeta(post.id as string, CRON_ACTOR_ID);
      results.push({ id: post.id as string, ok: true });
    } catch (e) {
      results.push({
        id: post.id as string,
        ok: false,
        error: e instanceof Error ? e.message : "erro",
      });
    }
  }
  return results;
}
