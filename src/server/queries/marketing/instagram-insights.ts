import { createClient } from "@/lib/supabase/server";
import { marketingSchema } from "@/lib/supabase/marketing";
import { truncateCaption } from "@/lib/marketing/instagram-insights";
import type {
  CalendarPostEvent,
  InstagramCarouselChild,
  InstagramMediaInsightRow,
} from "@/types/marketing";

export async function getInstagramMediaForCalendar(filters?: {
  from?: string;
  to?: string;
}): Promise<CalendarPostEvent[]> {
  const supabase = await createClient();
  let q = marketingSchema(supabase)
    .from("instagram_media_insights")
    .select("media_id, data_referencia, published_at, caption, media_type, permalink")
    .not("published_at", "is", null)
    .order("data_referencia", { ascending: false });

  if (filters?.from) q = q.gte("published_at", filters.from);
  if (filters?.to) q = q.lte("published_at", filters.to);

  const { data, error } = await q;
  if (error) throw error;

  const seen = new Set<string>();
  const events: CalendarPostEvent[] = [];

  for (const row of data ?? []) {
    const mediaId = row.media_id as string;
    if (seen.has(mediaId)) continue;
    seen.add(mediaId);

    const publishedAt = row.published_at as string;
    events.push({
      id: mediaId,
      title: truncateCaption(row.caption as string | null),
      start: publishedAt,
      status: "instagram_publicado",
      eventSource: "instagram_media",
      platformSlug: "instagram",
      platformName: "Instagram",
      platformColor: "#E4405F",
      campaignColor: null,
    });
  }

  return events;
}

export async function getInstagramMediaInsightHistory(
  mediaId: string,
): Promise<InstagramMediaInsightRow[]> {
  const supabase = await createClient();
  const { data, error } = await marketingSchema(supabase)
    .from("instagram_media_insights")
    .select("*")
    .eq("media_id", mediaId)
    .order("data_referencia", { ascending: true });

  if (error) throw error;
  return (data ?? []) as InstagramMediaInsightRow[];
}

/** Snapshot with the newest data_referencia (source of truth for media_url). */
export async function getInstagramMediaLatest(
  mediaId: string,
): Promise<InstagramMediaInsightRow | null> {
  const supabase = await createClient();
  const { data, error } = await marketingSchema(supabase)
    .from("instagram_media_insights")
    .select("*")
    .eq("media_id", mediaId)
    .order("data_referencia", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return (data as InstagramMediaInsightRow | null) ?? null;
}

export async function getInstagramCarouselChildById(
  childMediaId: string,
): Promise<InstagramCarouselChild | null> {
  const supabase = await createClient();
  const { data, error } = await marketingSchema(supabase)
    .from("instagram_carousel_children")
    .select("*")
    .eq("child_media_id", childMediaId)
    .maybeSingle();

  if (error) throw error;
  return (data as InstagramCarouselChild | null) ?? null;
}

export async function getInstagramCarouselChildren(
  parentMediaId: string,
): Promise<InstagramCarouselChild[]> {
  const supabase = await createClient();
  const { data, error } = await marketingSchema(supabase)
    .from("instagram_carousel_children")
    .select("*")
    .eq("parent_media_id", parentMediaId)
    .order("position", { ascending: true });

  if (error) throw error;
  return (data ?? []) as InstagramCarouselChild[];
}

export async function getPublishedExternalPostIds(): Promise<Set<string>> {
  const supabase = await createClient();
  const { data, error } = await marketingSchema(supabase)
    .from("content_posts")
    .select("external_post_id")
    .eq("status", "publicado")
    .not("external_post_id", "is", null);

  if (error) throw error;
  return new Set((data ?? []).map((r) => r.external_post_id as string).filter(Boolean));
}
