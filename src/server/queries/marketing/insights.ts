import { createClient } from "@/lib/supabase/server";
import { marketingSchema } from "@/lib/supabase/marketing";
import type {
  BrandMention,
  FollowersHistoryRow,
  InsightsFilters,
  MarketingReport,
  MentionsData,
  NetworkOverview,
  ReportListItem,
  ReportTipo,
  SiteAnalytics,
  SiteDailyRow,
  SiteTopPage,
  SiteTrafficSource,
  SocialNetwork,
  SocialPost,
  YouTubeData,
  YouTubeStats,
  YouTubeVideo,
} from "@/types/marketing-insights";

function num(v: number | null | undefined): number {
  return v == null || Number.isNaN(Number(v)) ? 0 : Number(v);
}

/** Próximo dia (UTC) de uma data ISO yyyy-mm-dd — usado em filtros de período. */
function nextDayIso(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

/** Mantém, por id, a linha com a data_referencia mais recente (métrica cumulativa). */
function latestPerId<T extends { data_referencia: string }>(
  rows: T[],
  idOf: (r: T) => string,
): T[] {
  const map = new Map<string, T>();
  for (const r of rows) {
    const id = idOf(r);
    const cur = map.get(id);
    if (!cur || r.data_referencia >= cur.data_referencia) map.set(id, r);
  }
  return [...map.values()];
}

// ===========================================================================
// Redes sociais
// ===========================================================================

/** Linhas brutas da v_followers_history no período (total + ganho por rede/dia). */
export async function getFollowersHistory(
  filters: InsightsFilters,
): Promise<FollowersHistoryRow[]> {
  const supabase = await createClient();
  const { data, error } = await marketingSchema(supabase)
    .from("v_followers_history")
    .select("network, data_referencia, total_followers, followers_gained")
    .gte("data_referencia", filters.date_from)
    .lte("data_referencia", filters.date_to)
    .order("data_referencia", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as FollowersHistoryRow[];
}

type FollowerAgg = { latest: number | null; latestDate: string; gain: number };

function aggregateFollowers(
  rows: FollowersHistoryRow[],
): Record<SocialNetwork, FollowerAgg> {
  const acc: Record<SocialNetwork, FollowerAgg> = {
    instagram: { latest: null, latestDate: "", gain: 0 },
    facebook: { latest: null, latestDate: "", gain: 0 },
    linkedin: { latest: null, latestDate: "", gain: 0 },
  };
  for (const r of rows) {
    const a = acc[r.network];
    if (!a) continue;
    if (r.total_followers != null && r.data_referencia >= a.latestDate) {
      a.latest = r.total_followers;
      a.latestDate = r.data_referencia;
    }
    a.gain += num(r.followers_gained);
  }
  return acc;
}

/** Resumo por rede no período (cards + base do gráfico de engajamento). */
export async function getSocialOverview(
  filters: InsightsFilters,
): Promise<NetworkOverview[]> {
  const supabase = await createClient();
  const mk = marketingSchema(supabase);
  const { date_from, date_to } = filters;

  const [followersRows, ig, fbPage, fbPosts, li, igMedia] = await Promise.all([
    getFollowersHistory(filters),
    mk
      .from("instagram_organic_insights")
      .select("reach, impressions, likes, comments, shares")
      .gte("data_referencia", date_from)
      .lte("data_referencia", date_to),
    mk
      .from("facebook_page_insights")
      .select("reach, impressions")
      .gte("data_referencia", date_from)
      .lte("data_referencia", date_to),
    mk
      .from("facebook_post_insights")
      .select("post_id, data_referencia, reactions_total, comments, shares, is_boosted")
      .gte("data_referencia", date_from)
      .lte("data_referencia", date_to),
    mk
      .from("linkedin_page_insights")
      .select("impressions, unique_impressions, likes, comments, shares")
      .gte("data_referencia", date_from)
      .lte("data_referencia", date_to),
    mk
      .from("instagram_media_insights")
      .select("media_id, is_boosted")
      .eq("is_boosted", true)
      .gte("data_referencia", date_from)
      .lte("data_referencia", date_to),
  ]);

  for (const r of [ig, fbPage, fbPosts, li, igMedia]) {
    if (r.error) throw r.error;
  }

  const followers = aggregateFollowers(followersRows);

  // Instagram
  const igRows = (ig.data ?? []) as Array<Record<string, number | null>>;
  const igLikes = igRows.reduce((s, r) => s + num(r.likes), 0);
  const igComments = igRows.reduce((s, r) => s + num(r.comments), 0);
  const igShares = igRows.reduce((s, r) => s + num(r.shares), 0);
  const igBoosted = new Set(
    ((igMedia.data ?? []) as Array<{ media_id: string }>).map((r) => r.media_id),
  ).size;

  // Facebook — engajamento a partir dos posts (cumulativo → último por post)
  const fbPostRows = (fbPosts.data ?? []) as Array<{
    post_id: string;
    data_referencia: string;
    reactions_total: number | null;
    comments: number | null;
    shares: number | null;
    is_boosted: boolean | null;
  }>;
  const fbLatest = latestPerId(fbPostRows, (r) => r.post_id);
  const fbLikes = fbLatest.reduce((s, r) => s + num(r.reactions_total), 0);
  const fbComments = fbLatest.reduce((s, r) => s + num(r.comments), 0);
  const fbShares = fbLatest.reduce((s, r) => s + num(r.shares), 0);
  const fbBoosted = fbLatest.filter((r) => r.is_boosted).length;
  const fbPageRows = (fbPage.data ?? []) as Array<Record<string, number | null>>;

  // LinkedIn
  const liRows = (li.data ?? []) as Array<Record<string, number | null>>;
  const liLikes = liRows.reduce((s, r) => s + num(r.likes), 0);
  const liComments = liRows.reduce((s, r) => s + num(r.comments), 0);
  const liShares = liRows.reduce((s, r) => s + num(r.shares), 0);

  return [
    {
      network: "instagram",
      followers: followers.instagram.latest,
      followers_delta: followers.instagram.gain,
      reach: igRows.reduce((s, r) => s + num(r.reach), 0),
      impressions: igRows.reduce((s, r) => s + num(r.impressions), 0),
      likes: igLikes,
      comments: igComments,
      shares: igShares,
      engagement: igLikes + igComments + igShares,
      boosted_posts: igBoosted,
    },
    {
      network: "facebook",
      followers: followers.facebook.latest,
      followers_delta: followers.facebook.gain,
      reach: fbPageRows.reduce((s, r) => s + num(r.reach), 0),
      impressions: fbPageRows.reduce((s, r) => s + num(r.impressions), 0),
      likes: fbLikes,
      comments: fbComments,
      shares: fbShares,
      engagement: fbLikes + fbComments + fbShares,
      boosted_posts: fbBoosted,
    },
    {
      network: "linkedin",
      followers: followers.linkedin.latest,
      followers_delta: followers.linkedin.gain,
      reach: liRows.reduce((s, r) => s + num(r.unique_impressions), 0),
      impressions: liRows.reduce((s, r) => s + num(r.impressions), 0),
      likes: liLikes,
      comments: liComments,
      shares: liShares,
      engagement: liLikes + liComments + liShares,
      boosted_posts: 0,
    },
  ];
}

/** Extras do Instagram para a aba por rede: visitas ao perfil + demografia. */
export async function getInstagramExtra(
  filters: InsightsFilters,
): Promise<{ profile_views: number; follower_demographics: unknown | null }> {
  const supabase = await createClient();
  const { data, error } = await marketingSchema(supabase)
    .from("instagram_organic_insights")
    .select("profile_views, follower_demographics, data_referencia")
    .gte("data_referencia", filters.date_from)
    .lte("data_referencia", filters.date_to)
    .order("data_referencia", { ascending: false });
  if (error) throw error;
  const rows = (data ?? []) as Array<{
    profile_views: number | null;
    follower_demographics: unknown;
  }>;
  return {
    profile_views: rows.reduce((s, r) => s + num(r.profile_views), 0),
    follower_demographics:
      rows.find((r) => r.follower_demographics != null)?.follower_demographics ?? null,
  };
}

/** Posts orgânicos (IG + FB + LinkedIn) publicados no período, agregados por post. */
export async function getSocialPosts(
  filters: InsightsFilters,
  network?: "instagram" | "facebook" | "linkedin",
): Promise<SocialPost[]> {
  const supabase = await createClient();
  const mk = marketingSchema(supabase);
  const { date_from, date_to } = filters;

  const wantIg = !network || network === "instagram";
  const wantFb = !network || network === "facebook";
  const wantLi = !network || network === "linkedin";

  const [igRes, fbRes, liRes] = await Promise.all([
    wantIg
      ? mk
          .from("instagram_media_insights")
          .select(
            "media_id, data_referencia, media_type, media_product_type, permalink, media_url, thumbnail_url, caption, published_at, reach, impressions, likes, comments, saves, shares, plays, is_boosted, ad_spend, ad_impressions, ad_reach",
          )
          .gte("published_at", date_from)
          .lt("published_at", nextDayIso(date_to))
      : Promise.resolve({ data: [], error: null }),
    wantFb
      ? mk
          .from("facebook_post_insights")
          .select(
            "post_id, data_referencia, post_type, permalink, message, published_at, reach, impressions, reactions_total, comments, shares, clicks, is_boosted, ad_spend, ad_impressions, ad_reach",
          )
          .gte("published_at", date_from)
          .lt("published_at", nextDayIso(date_to))
      : Promise.resolve({ data: [], error: null }),
    wantLi
      ? mk
          .from("linkedin_post_insights")
          .select(
            "post_id, data_referencia, post_type, permalink, thumbnail_url, text, published_at, impressions, unique_impressions, clicks, likes, comments, shares, video_views",
          )
          .gte("published_at", date_from)
          .lt("published_at", nextDayIso(date_to))
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (igRes.error) throw igRes.error;
  if (fbRes.error) throw fbRes.error;
  if (liRes.error) throw liRes.error;

  const posts: SocialPost[] = [];

  const igRows = (igRes.data ?? []) as Array<Record<string, unknown>>;
  for (const r of latestPerId(
    igRows as Array<{ data_referencia: string } & Record<string, unknown>>,
    (r) => r.media_id as string,
  )) {
    posts.push({
      network: "instagram",
      id: r.media_id as string,
      permalink: (r.permalink as string) ?? null,
      thumbnail_url: ((r.thumbnail_url as string) || (r.media_url as string)) ?? null,
      caption: (r.caption as string) ?? null,
      media_type: (r.media_type as string) ?? null,
      media_product_type: (r.media_product_type as string) ?? null,
      published_at: (r.published_at as string) ?? null,
      reach: num(r.reach as number),
      impressions: num(r.impressions as number),
      likes: num(r.likes as number),
      comments: num(r.comments as number),
      shares: num(r.shares as number),
      saves: num(r.saves as number),
      plays: num(r.plays as number),
      reactions: 0,
      clicks: 0,
      is_boosted: Boolean(r.is_boosted),
      ad_spend: r.ad_spend == null ? null : Number(r.ad_spend),
      ad_impressions: r.ad_impressions == null ? null : Number(r.ad_impressions),
      ad_reach: r.ad_reach == null ? null : Number(r.ad_reach),
    });
  }

  const fbRows = (fbRes.data ?? []) as Array<Record<string, unknown>>;
  for (const r of latestPerId(
    fbRows as Array<{ data_referencia: string } & Record<string, unknown>>,
    (r) => r.post_id as string,
  )) {
    posts.push({
      network: "facebook",
      id: r.post_id as string,
      permalink: (r.permalink as string) ?? null,
      thumbnail_url: null,
      caption: (r.message as string) ?? null,
      media_type: (r.post_type as string) ?? null,
      media_product_type: null,
      published_at: (r.published_at as string) ?? null,
      reach: num(r.reach as number),
      impressions: num(r.impressions as number),
      likes: num(r.reactions_total as number),
      comments: num(r.comments as number),
      shares: num(r.shares as number),
      saves: 0,
      plays: 0,
      reactions: num(r.reactions_total as number),
      clicks: num(r.clicks as number),
      is_boosted: Boolean(r.is_boosted),
      ad_spend: r.ad_spend == null ? null : Number(r.ad_spend),
      ad_impressions: r.ad_impressions == null ? null : Number(r.ad_impressions),
      ad_reach: r.ad_reach == null ? null : Number(r.ad_reach),
    });
  }

  const liRows = (liRes.data ?? []) as Array<Record<string, unknown>>;
  for (const r of latestPerId(
    liRows as Array<{ data_referencia: string } & Record<string, unknown>>,
    (r) => r.post_id as string,
  )) {
    const likes = num(r.likes as number);
    posts.push({
      network: "linkedin",
      id: r.post_id as string,
      permalink: (r.permalink as string) ?? null,
      thumbnail_url: (r.thumbnail_url as string) ?? null,
      caption: (r.text as string) ?? null,
      media_type: (r.post_type as string) ?? null,
      media_product_type: null,
      published_at: (r.published_at as string) ?? null,
      reach: num(r.unique_impressions as number),
      impressions: num(r.impressions as number),
      likes,
      comments: num(r.comments as number),
      shares: num(r.shares as number),
      saves: 0,
      plays: num(r.video_views as number),
      reactions: likes,
      clicks: num(r.clicks as number),
      is_boosted: false,
      ad_spend: null,
      ad_impressions: null,
      ad_reach: null,
    });
  }

  return posts.sort((a, b) => {
    const da = a.published_at ?? "";
    const db = b.published_at ?? "";
    return da < db ? 1 : da > db ? -1 : 0;
  });
}

// ===========================================================================
// YouTube
// ===========================================================================

export async function getYouTube(): Promise<YouTubeData> {
  const supabase = await createClient();
  const mk = marketingSchema(supabase);

  const [statsRes, videosRes] = await Promise.all([
    mk
      .from("imbil_youtube_stats")
      .select("snapshot_date, subscriber_count, view_count, video_count")
      .order("snapshot_date", { ascending: true }),
    mk
      .from("imbil_youtube_videos")
      .select(
        "video_id, title, published_at, view_count, like_count, comment_count, thumbnail_url",
      )
      .order("published_at", { ascending: false }),
  ]);
  if (statsRes.error) throw statsRes.error;
  if (videosRes.error) throw videosRes.error;

  const history = (statsRes.data ?? []) as YouTubeStats[];
  const videos = (videosRes.data ?? []) as YouTubeVideo[];

  return {
    latest: history.length ? history[history.length - 1] : null,
    history,
    videos,
  };
}

// ===========================================================================
// Acessos do site (Google Analytics)
// ===========================================================================

export async function getSiteAnalytics(filters: InsightsFilters): Promise<SiteAnalytics> {
  const supabase = await createClient();
  const mk = marketingSchema(supabase);
  const { date_from, date_to } = filters;

  const [dailyRes, pagesRes, sourcesRes] = await Promise.all([
    mk
      .from("google_analytics_daily")
      .select(
        "data_referencia, sessions, engaged_sessions, bounce_rate, avg_session_duration, screen_page_views, new_users, total_users, key_events",
      )
      .gte("data_referencia", date_from)
      .lte("data_referencia", date_to)
      .order("data_referencia", { ascending: true }),
    mk
      .from("google_analytics_top_pages")
      .select("page_path, page_title, screen_page_views, avg_engagement_time, key_events")
      .gte("data_referencia", date_from)
      .lte("data_referencia", date_to),
    mk
      .from("google_analytics_traffic_sources")
      .select("channel, sessions, engaged_sessions, new_users")
      .gte("data_referencia", date_from)
      .lte("data_referencia", date_to),
  ]);
  if (dailyRes.error) throw dailyRes.error;
  if (pagesRes.error) throw pagesRes.error;
  if (sourcesRes.error) throw sourcesRes.error;

  const daily = (dailyRes.data ?? []) as SiteDailyRow[];

  // Top páginas — agrega por page_path no período.
  const pageMap = new Map<string, SiteTopPage & { _engSum: number; _engN: number }>();
  for (const r of (pagesRes.data ?? []) as Array<Record<string, unknown>>) {
    const path = (r.page_path as string) ?? "(sem path)";
    const acc =
      pageMap.get(path) ??
      ({
        page_path: path,
        page_title: (r.page_title as string) ?? null,
        screen_page_views: 0,
        avg_engagement_time: null,
        key_events: 0,
        _engSum: 0,
        _engN: 0,
      } as SiteTopPage & { _engSum: number; _engN: number });
    acc.screen_page_views += num(r.screen_page_views as number);
    acc.key_events += num(r.key_events as number);
    if (r.avg_engagement_time != null) {
      acc._engSum += Number(r.avg_engagement_time);
      acc._engN += 1;
    }
    if (!acc.page_title && r.page_title) acc.page_title = r.page_title as string;
    pageMap.set(path, acc);
  }
  const topPages = [...pageMap.values()]
    .map(({ _engSum, _engN, ...p }) => ({
      ...p,
      avg_engagement_time: _engN > 0 ? Math.round((_engSum / _engN) * 10) / 10 : null,
    }))
    .sort((a, b) => b.screen_page_views - a.screen_page_views)
    .slice(0, 15);

  // Fontes de tráfego — agrega por canal.
  const srcMap = new Map<string, SiteTrafficSource>();
  for (const r of (sourcesRes.data ?? []) as Array<Record<string, unknown>>) {
    const channel = (r.channel as string) ?? "(outros)";
    const acc =
      srcMap.get(channel) ??
      ({
        channel,
        sessions: 0,
        engaged_sessions: 0,
        new_users: 0,
      } as SiteTrafficSource);
    acc.sessions += num(r.sessions as number);
    acc.engaged_sessions += num(r.engaged_sessions as number);
    acc.new_users += num(r.new_users as number);
    srcMap.set(channel, acc);
  }
  const sources = [...srcMap.values()].sort((a, b) => b.sessions - a.sessions);

  const daysCovered = new Set(daily.map((d) => d.data_referencia)).size;

  return { daily, topPages, sources, daysCovered };
}

// ===========================================================================
// Menções à marca
// ===========================================================================

export async function getBrandMentions(): Promise<MentionsData> {
  const supabase = await createClient();
  const { data, error } = await marketingSchema(supabase)
    .from("brand_mentions")
    .select(
      "id, plataforma, autor_nome, autor_urn, texto, url, imagem_post_url, imagem_autor_url, data_publicacao, rating",
    )
    .order("data_publicacao", { ascending: false });
  if (error) throw error;

  const mentions = (data ?? []) as BrandMention[];

  const platformCounts = new Map<string, number>();
  const ratingCounts = new Map<number, number>();
  let ratingSum = 0;
  let ratingsCount = 0;

  for (const m of mentions) {
    platformCounts.set(m.plataforma, (platformCounts.get(m.plataforma) ?? 0) + 1);
    if (m.rating != null) {
      ratingsCount += 1;
      ratingSum += m.rating;
      ratingCounts.set(m.rating, (ratingCounts.get(m.rating) ?? 0) + 1);
    }
  }

  const byPlatform = [...platformCounts.entries()]
    .map(([plataforma, count]) => ({ plataforma, count }))
    .sort((a, b) => b.count - a.count);

  const ratingDistribution = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: ratingCounts.get(stars) ?? 0,
  }));

  return {
    mentions,
    total: mentions.length,
    byPlatform,
    ratingsAvg:
      ratingsCount > 0 ? Math.round((ratingSum / ratingsCount) * 10) / 10 : null,
    ratingsCount,
    ratingDistribution,
  };
}

// ===========================================================================
// Relatórios de IA (marketing.marketing_reports)
// ===========================================================================

const REPORT_COLS =
  "id, periodo_inicio, periodo_fim, tipo, report_markdown, report_json, model, gerado_em";

export async function getLatestReport(): Promise<MarketingReport | null> {
  const supabase = await createClient();
  const { data, error } = await marketingSchema(supabase)
    .from("marketing_reports")
    .select(REPORT_COLS)
    .order("gerado_em", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as MarketingReport | null) ?? null;
}

export async function getReportById(id: string): Promise<MarketingReport | null> {
  const supabase = await createClient();
  const { data, error } = await marketingSchema(supabase)
    .from("marketing_reports")
    .select(REPORT_COLS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as MarketingReport | null) ?? null;
}

export async function listReports(tipo?: ReportTipo): Promise<ReportListItem[]> {
  const supabase = await createClient();
  let q = marketingSchema(supabase)
    .from("marketing_reports")
    .select("id, tipo, model, periodo_inicio, periodo_fim, gerado_em")
    .order("gerado_em", { ascending: false, nullsFirst: false });
  if (tipo) q = q.eq("tipo", tipo);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as ReportListItem[];
}
