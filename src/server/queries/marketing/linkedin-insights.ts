import { createClient } from "@/lib/supabase/server";
import { marketingSchema } from "@/lib/supabase/marketing";
import { truncateText } from "@/lib/marketing/linkedin-insights";
import type { CalendarPostEvent, LinkedInPostInsightRow } from "@/types/marketing";

/**
 * Posts do LinkedIn sincronizados (snapshots diários em linkedin_post_insights).
 * A tabela é alimentada por workflow externo e pode não existir em todos os
 * ambientes — em erro, o calendário segue sem os eventos do LinkedIn.
 */
export async function getLinkedInPostsForCalendar(filters?: {
  from?: string;
  to?: string;
}): Promise<CalendarPostEvent[]> {
  const supabase = await createClient();
  let q = marketingSchema(supabase)
    .from("linkedin_post_insights")
    .select("post_id, data_referencia, published_at, text, permalink")
    .not("published_at", "is", null)
    .order("data_referencia", { ascending: false });

  if (filters?.from) q = q.gte("published_at", filters.from);
  if (filters?.to) q = q.lte("published_at", filters.to);

  const { data, error } = await q;
  if (error) {
    console.error(`Falha ao listar posts do LinkedIn: ${error.message}`);
    return [];
  }

  const seen = new Set<string>();
  const events: CalendarPostEvent[] = [];

  for (const row of data ?? []) {
    const postId = row.post_id as string;
    if (seen.has(postId)) continue;
    seen.add(postId);

    events.push({
      id: postId,
      title: truncateText(row.text as string | null),
      start: row.published_at as string,
      status: "linkedin_publicado",
      eventSource: "linkedin_post",
      platformSlug: "linkedin",
      platformName: "LinkedIn",
      platformColor: "#0A66C2",
      campaignColor: null,
    });
  }

  return events;
}

export async function getLinkedInPostInsightHistory(
  postId: string,
): Promise<LinkedInPostInsightRow[]> {
  const supabase = await createClient();
  const { data, error } = await marketingSchema(supabase)
    .from("linkedin_post_insights")
    .select("*")
    .eq("post_id", postId)
    .order("data_referencia", { ascending: true });

  if (error) throw error;
  return (data ?? []) as LinkedInPostInsightRow[];
}

export async function getLinkedInPostLatest(
  postId: string,
): Promise<LinkedInPostInsightRow | null> {
  const supabase = await createClient();
  const { data, error } = await marketingSchema(supabase)
    .from("linkedin_post_insights")
    .select("*")
    .eq("post_id", postId)
    .order("data_referencia", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return (data as LinkedInPostInsightRow | null) ?? null;
}
