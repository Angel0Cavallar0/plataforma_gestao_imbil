import { createClient } from "@/lib/supabase/server";
import { marketingSchema } from "@/lib/supabase/marketing";
import { resolvePostAssetsPreviewUrls } from "@/lib/marketing/asset-preview";
import type {
  Asset,
  CalendarPostEvent,
  Campaign,
  ContentKpis,
  Platform,
  Post,
  PostWithRelations,
} from "@/types/marketing";

export async function getActivePlatforms(): Promise<Platform[]> {
  const supabase = await createClient();
  const { data, error } = await marketingSchema(supabase)
    .from("platforms")
    .select("*")
    .eq("is_active", true)
    .order("name");
  if (error) throw error;
  return (data ?? []) as Platform[];
}

export async function getCampaigns(): Promise<Campaign[]> {
  const supabase = await createClient();
  const { data, error } = await marketingSchema(supabase)
    .from("content_campaigns")
    .select("*")
    .eq("is_active", true)
    .order("name");
  if (error) throw error;
  return (data ?? []) as Campaign[];
}

export async function getPostsForCalendar(filters?: {
  from?: string;
  to?: string;
  platformId?: string;
  status?: string;
  campaignId?: string;
  assignedTo?: string;
}): Promise<CalendarPostEvent[]> {
  const supabase = await createClient();
  let q = marketingSchema(supabase)
    .from("content_posts")
    .select(
      "id, title, scheduled_at, status, campaign:content_campaigns(color), platform:platforms(slug, name, color)",
    );

  if (filters?.from) q = q.gte("scheduled_at", filters.from);
  if (filters?.to) q = q.lte("scheduled_at", filters.to);
  if (filters?.platformId) q = q.eq("platform_id", filters.platformId);
  if (filters?.status) q = q.eq("status", filters.status);
  if (filters?.campaignId) q = q.eq("campaign_id", filters.campaignId);
  if (filters?.assignedTo) q = q.eq("assigned_to", filters.assignedTo);

  const { data, error } = await q.order("scheduled_at");
  if (error) throw error;

  return (data ?? []).map((row) => {
    const platformRaw = row.platform as unknown;
    const platform = (Array.isArray(platformRaw) ? platformRaw[0] : platformRaw) as {
      slug: string;
      name: string;
      color: string | null;
    } | null;
    const campaignRaw = row.campaign as unknown;
    const campaign = (Array.isArray(campaignRaw) ? campaignRaw[0] : campaignRaw) as {
      color: string | null;
    } | null;
    return {
      id: row.id as string,
      title: row.title as string,
      start: row.scheduled_at as string,
      status: row.status as CalendarPostEvent["status"],
      platformSlug: platform?.slug ?? "",
      platformName: platform?.name ?? "",
      platformColor: platform?.color ?? null,
      campaignColor: campaign?.color ?? null,
    };
  });
}

export async function getPostById(id: string): Promise<PostWithRelations | null> {
  const supabase = await createClient();
  const { data, error } = await marketingSchema(supabase)
    .from("content_posts")
    .select(
      `*,
      platform:platforms(slug, name, icon, color),
      campaign:content_campaigns(id, name, color),
      assets:content_assets(*)
    `,
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  let assigned_to_profile: PostWithRelations["assigned_to_profile"] = null;
  if (data.assigned_to) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", data.assigned_to)
      .maybeSingle();
    if (profile) assigned_to_profile = profile;
  }

  const platformRaw = data.platform as unknown;
  const platform = (
    Array.isArray(platformRaw) ? platformRaw[0] : platformRaw
  ) as PostWithRelations["platform"];
  const campaignRaw = data.campaign as unknown;
  const campaign = (
    Array.isArray(campaignRaw) ? campaignRaw[0] : campaignRaw
  ) as PostWithRelations["campaign"];

  const rawAssets = (data.assets as Asset[]) ?? [];
  const assets = await resolvePostAssetsPreviewUrls(rawAssets);

  return {
    ...(data as Post),
    platform,
    campaign: campaign ?? null,
    assigned_to_profile,
    assets,
  };
}

export async function listPosts(filters?: {
  status?: string;
  platformId?: string;
}): Promise<Post[]> {
  const supabase = await createClient();
  let q = marketingSchema(supabase).from("content_posts").select("*");
  if (filters?.status) q = q.eq("status", filters.status);
  if (filters?.platformId) q = q.eq("platform_id", filters.platformId);
  const { data, error } = await q.order("scheduled_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Post[];
}

export async function getContentKpis(): Promise<ContentKpis> {
  const supabase = await createClient();
  const now = new Date();
  const in7d = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const ago30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [scheduled, published, drafts, failed] = await Promise.all([
    marketingSchema(supabase)
      .from("content_posts")
      .select("id", { count: "exact", head: true })
      .eq("status", "agendado")
      .lte("scheduled_at", in7d)
      .gte("scheduled_at", now.toISOString()),
    marketingSchema(supabase)
      .from("content_posts")
      .select("id", { count: "exact", head: true })
      .eq("status", "publicado")
      .gte("published_at", ago30d),
    marketingSchema(supabase)
      .from("content_posts")
      .select("id", { count: "exact", head: true })
      .eq("status", "rascunho"),
    marketingSchema(supabase)
      .from("content_posts")
      .select("id", { count: "exact", head: true })
      .eq("status", "falhou"),
  ]);

  return {
    scheduledNext7d: scheduled.count ?? 0,
    publishedLast30d: published.count ?? 0,
    drafts: drafts.count ?? 0,
    failedUnresolved: failed.count ?? 0,
  };
}

export async function getMetaCredentials() {
  const supabase = await createClient();
  const { data, error } = await marketingSchema(supabase)
    .from("integration_credentials")
    .select("*, platform:platforms(slug, name)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
