import { createClient } from "@/lib/supabase/server";
import { marketingSchema } from "@/lib/supabase/marketing";
import { truncateMessage } from "@/lib/marketing/facebook-insights";
import type {
  CalendarPostEvent,
  CrossPostLink,
  FacebookPostInsightRow,
} from "@/types/marketing";

export async function getFacebookPostsForCalendar(filters?: {
  from?: string;
  to?: string;
}): Promise<CalendarPostEvent[]> {
  const supabase = await createClient();
  let q = marketingSchema(supabase)
    .from("facebook_post_insights")
    .select("post_id, data_referencia, published_at, message, post_type")
    .not("published_at", "is", null)
    .order("data_referencia", { ascending: false });

  if (filters?.from) q = q.gte("published_at", filters.from);
  if (filters?.to) q = q.lte("published_at", filters.to);

  const { data, error } = await q;
  if (error) throw error;

  const seen = new Set<string>();
  const events: CalendarPostEvent[] = [];

  for (const row of data ?? []) {
    const postId = row.post_id as string;
    if (seen.has(postId)) continue;
    seen.add(postId);

    events.push({
      id: postId,
      title: truncateMessage(row.message as string | null),
      start: row.published_at as string,
      status: "facebook_publicado",
      eventSource: "facebook_post",
      platformSlug: "facebook",
      platformName: "Facebook",
      platformColor: "#1877F2",
      campaignColor: null,
      mediaType: (row.post_type as string | null) ?? null,
    });
  }

  return events;
}

export async function getFacebookPostInsightHistory(
  postId: string,
): Promise<FacebookPostInsightRow[]> {
  const supabase = await createClient();
  const { data, error } = await marketingSchema(supabase)
    .from("facebook_post_insights")
    .select("*")
    .eq("post_id", postId)
    .order("data_referencia", { ascending: true });

  if (error) throw error;
  return (data ?? []) as FacebookPostInsightRow[];
}

export async function getFacebookPostLatest(
  postId: string,
): Promise<FacebookPostInsightRow | null> {
  const supabase = await createClient();
  const { data, error } = await marketingSchema(supabase)
    .from("facebook_post_insights")
    .select("*")
    .eq("post_id", postId)
    .order("data_referencia", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return (data as FacebookPostInsightRow | null) ?? null;
}

export async function getCrossPostLinkByFacebookPostId(
  facebookPostId: string,
): Promise<CrossPostLink | null> {
  const supabase = await createClient();
  const { data, error } = await marketingSchema(supabase)
    .from("cross_post_links")
    .select("*")
    .eq("facebook_post_id", facebookPostId)
    .maybeSingle();

  if (error) throw error;
  return (data as CrossPostLink | null) ?? null;
}
