import { createClient } from "@/lib/supabase/server";
import { marketingSchema } from "@/lib/supabase/marketing";
import { IMBIL_NAME } from "@/types/marketing-competitors";
import type {
  Competitor,
  CompetitorAd,
  CompetitorNews,
  CompetitorOverview,
  CompetitorProfile,
  CompetitorReview,
  FollowersPoint,
  IgPost,
  KeywordMatrix,
  KeywordRanking,
  SubscribersPoint,
  TrendPoint,
  TrendSeries,
  YoutubeStat,
  YoutubeVideo,
} from "@/types/marketing-competitors";

/** Data ISO (YYYY-MM-DD) de `days` atrás — usada nos filtros de período. */
function sinceDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

const COMPETITOR_COLUMNS =
  "id, name, country, active, notes, ig_handle, yt_handle, yt_channel_id, fb_slug, fb_followers, google_rating, google_reviews_count, website_url, profile_updated_at";

/** Lista de concorrentes ativos (para seletores e mapeamento id→nome). */
export async function getCompetitors(): Promise<Competitor[]> {
  const supabase = await createClient();
  const { data, error } = await marketingSchema(supabase)
    .from("competitors")
    .select(COMPETITOR_COLUMNS)
    .eq("active", true)
    .order("name");
  if (error) throw error;
  return (data ?? []) as unknown as Competitor[];
}

/** Visão geral consolidada (view v_competitors_overview). */
export async function getCompetitorsOverview(): Promise<CompetitorOverview[]> {
  const supabase = await createClient();
  const { data, error } = await marketingSchema(supabase)
    .from("v_competitors_overview")
    .select("*")
    .order("name");
  if (error) throw error;
  return (data ?? []) as unknown as CompetitorOverview[];
}

/** Data/hora da coleta mais recente entre as fontes (para "dados atualizados em"). */
export async function getLastCollectedAt(): Promise<string | null> {
  const supabase = await createClient();
  const tables = [
    "competitor_ig_posts",
    "competitor_youtube_stats",
    "competitor_youtube_videos",
    "competitor_reviews",
    "competitor_news",
    "competitor_ads",
  ] as const;

  const results = await Promise.all(
    tables.map((t) =>
      marketingSchema(supabase)
        .from(t)
        .select("collected_at")
        .order("collected_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ),
  );

  let max: string | null = null;
  for (const r of results) {
    const value = (r.data as { collected_at?: string } | null)?.collected_at;
    if (value && (!max || value > max)) max = value;
  }
  return max;
}

// ---------------------------------------------------------------------------
// Instagram
// ---------------------------------------------------------------------------

/** Total de seguidores no Instagram da própria IMBIL (último snapshot). */
export async function getImbilIgFollowers(): Promise<number | null> {
  const supabase = await createClient();
  const { data, error } = await marketingSchema(supabase)
    .from("instagram_organic_insights")
    .select("followers_count")
    .not("followers_count", "is", null)
    .order("data_referencia", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as { followers_count: number } | null)?.followers_count ?? null;
}

export async function getIgPosts(competitorId?: string, limit = 60): Promise<IgPost[]> {
  const supabase = await createClient();
  let q = marketingSchema(supabase)
    .from("competitor_ig_posts")
    .select(
      "id, competitor_id, post_id, username, caption, media_type, published_at, like_count, comments_count, permalink, followers_count, snapshot_date",
    )
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(limit);
  if (competitorId) q = q.eq("competitor_id", competitorId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as IgPost[];
}

/** Série de seguidores IG por concorrente × dia (máximo do snapshot). */
export async function getIgFollowersTrend(
  competitorId?: string,
): Promise<FollowersPoint[]> {
  const supabase = await createClient();
  const [competitors, posts] = await Promise.all([
    getCompetitors(),
    (async () => {
      let q = marketingSchema(supabase)
        .from("competitor_ig_posts")
        .select("competitor_id, followers_count, snapshot_date")
        .not("followers_count", "is", null)
        .order("snapshot_date");
      if (competitorId) q = q.eq("competitor_id", competitorId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as {
        competitor_id: string;
        followers_count: number;
        snapshot_date: string;
      }[];
    })(),
  ]);

  const nameById = new Map(competitors.map((c) => [c.id, c.name]));
  const byKey = new Map<string, FollowersPoint>();
  for (const p of posts) {
    const key = `${p.competitor_id}:${p.snapshot_date}`;
    const existing = byKey.get(key);
    if (!existing || p.followers_count > existing.followers) {
      byKey.set(key, {
        competitorId: p.competitor_id,
        competitorName: nameById.get(p.competitor_id) ?? "—",
        snapshot_date: p.snapshot_date,
        followers: p.followers_count,
      });
    }
  }
  return Array.from(byKey.values()).sort((a, b) =>
    a.snapshot_date.localeCompare(b.snapshot_date),
  );
}

// ---------------------------------------------------------------------------
// YouTube
// ---------------------------------------------------------------------------

/** Total de inscritos no YouTube da própria IMBIL (último snapshot). */
export async function getImbilYoutubeSubscribers(): Promise<number | null> {
  const supabase = await createClient();
  const { data, error } = await marketingSchema(supabase)
    .from("imbil_youtube_stats")
    .select("subscriber_count")
    .not("subscriber_count", "is", null)
    .order("snapshot_date", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as { subscriber_count: number } | null)?.subscriber_count ?? null;
}

export async function getYoutubeStats(competitorId?: string): Promise<YoutubeStat[]> {
  const supabase = await createClient();
  let q = marketingSchema(supabase)
    .from("competitor_youtube_stats")
    .select("competitor_id, snapshot_date, subscriber_count, view_count, video_count")
    .order("snapshot_date");
  if (competitorId) q = q.eq("competitor_id", competitorId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as YoutubeStat[];
}

export async function getYoutubeVideos(
  competitorId?: string,
  limit = 60,
): Promise<YoutubeVideo[]> {
  const supabase = await createClient();
  let q = marketingSchema(supabase)
    .from("competitor_youtube_videos")
    .select(
      "id, competitor_id, video_id, title, description, published_at, view_count, like_count, comment_count, thumbnail_url",
    )
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(limit);
  if (competitorId) q = q.eq("competitor_id", competitorId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as YoutubeVideo[];
}

/** Série de inscritos por concorrente × snapshot. */
export async function getSubscribersTrend(
  competitorId?: string,
): Promise<SubscribersPoint[]> {
  const [competitors, stats] = await Promise.all([
    getCompetitors(),
    getYoutubeStats(competitorId),
  ]);
  const nameById = new Map(competitors.map((c) => [c.id, c.name]));
  return stats
    .filter((s) => s.subscriber_count != null)
    .map((s) => ({
      competitorId: s.competitor_id,
      competitorName: nameById.get(s.competitor_id) ?? "—",
      snapshot_date: s.snapshot_date,
      subscribers: s.subscriber_count ?? 0,
    }));
}

// ---------------------------------------------------------------------------
// Busca & Tendências (join por texto; sempre inclui IMBIL)
// ---------------------------------------------------------------------------

async function getLatestKeywordDate(): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await marketingSchema(supabase)
    .from("competitor_keyword_rankings")
    .select("data_referencia")
    .order("data_referencia", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as { data_referencia?: string } | null)?.data_referencia ?? null;
}

/** Matriz keyword × empresa (inclui IMBIL) para o heatmap de ranking de busca. */
export async function getKeywordMatrix(date?: string): Promise<KeywordMatrix> {
  const supabase = await createClient();
  const target = date ?? (await getLatestKeywordDate());
  if (!target) {
    return { date: null, keywords: [], competitors: [], positions: {} };
  }

  const { data, error } = await marketingSchema(supabase)
    .from("competitor_keyword_rankings")
    .select("data_referencia, keyword, competitor_name, position, url, title")
    .eq("data_referencia", target);
  if (error) throw error;
  const rows = (data ?? []) as unknown as KeywordRanking[];

  const keywords = Array.from(new Set(rows.map((r) => r.keyword))).sort();
  const names = Array.from(new Set(rows.map((r) => r.competitor_name)));
  // IMBIL sempre primeiro; demais em ordem alfabética.
  const competitors = [
    ...(names.includes(IMBIL_NAME) ? [IMBIL_NAME] : []),
    ...names.filter((n) => n !== IMBIL_NAME).sort(),
  ];

  const positions: Record<string, Record<string, number | null>> = {};
  for (const kw of keywords) positions[kw] = {};
  for (const r of rows) {
    const current = positions[r.keyword][r.competitor_name];
    // melhor (menor) posição vence se houver duplicidade
    if (current == null || (r.position != null && r.position < current)) {
      positions[r.keyword][r.competitor_name] = r.position;
    }
  }
  return { date: target, keywords, competitors, positions };
}

/** Histórico de posição por keyword (todas as empresas) ao longo do tempo. */
export async function getKeywordHistory(keyword: string): Promise<KeywordRanking[]> {
  const supabase = await createClient();
  const { data, error } = await marketingSchema(supabase)
    .from("competitor_keyword_rankings")
    .select("data_referencia, keyword, competitor_name, position, url, title")
    .eq("keyword", keyword)
    .order("data_referencia");
  if (error) throw error;
  return (data ?? []) as unknown as KeywordRanking[];
}

export async function getKeywordList(): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await marketingSchema(supabase)
    .from("competitor_keyword_rankings")
    .select("keyword");
  if (error) throw error;
  const rows = (data ?? []) as unknown as { keyword: string }[];
  return Array.from(new Set(rows.map((r) => r.keyword))).sort();
}

/** Tendências de interesse (Google Trends) agrupadas em séries por empresa. */
export async function getTrends(opts?: {
  keyword?: string;
  geo?: string;
  days?: number;
}): Promise<TrendSeries[]> {
  const supabase = await createClient();
  let q = marketingSchema(supabase)
    .from("competitor_trends")
    .select("data_referencia, empresa, keyword, interest, geo")
    .order("data_referencia");
  if (opts?.keyword) q = q.eq("keyword", opts.keyword);
  if (opts?.geo) q = q.eq("geo", opts.geo);
  if (opts?.days) q = q.gte("data_referencia", sinceDate(opts.days));
  const { data, error } = await q;
  if (error) throw error;
  const rows = (data ?? []) as unknown as TrendPoint[];

  const byEmpresa = new Map<string, { date: string; interest: number }[]>();
  for (const r of rows) {
    const list = byEmpresa.get(r.empresa) ?? [];
    list.push({ date: r.data_referencia, interest: r.interest ?? 0 });
    byEmpresa.set(r.empresa, list);
  }
  const series = Array.from(byEmpresa.entries()).map(([empresa, points]) => ({
    empresa,
    points,
  }));
  // IMBIL primeiro para destaque.
  return series.sort((a, b) => {
    if (a.empresa === IMBIL_NAME) return -1;
    if (b.empresa === IMBIL_NAME) return 1;
    return a.empresa.localeCompare(b.empresa);
  });
}

export async function getTrendKeywords(): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await marketingSchema(supabase)
    .from("competitor_trends")
    .select("keyword");
  if (error) throw error;
  const rows = (data ?? []) as unknown as { keyword: string }[];
  return Array.from(new Set(rows.map((r) => r.keyword))).sort();
}

export async function getTrendGeos(): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await marketingSchema(supabase)
    .from("competitor_trends")
    .select("geo")
    .not("geo", "is", null);
  if (error) throw error;
  const rows = (data ?? []) as unknown as { geo: string }[];
  return Array.from(new Set(rows.map((r) => r.geo))).sort();
}

// ---------------------------------------------------------------------------
// Anúncios / Notícias / Reputação
// ---------------------------------------------------------------------------

export async function getCompetitorAds(competitorId?: string): Promise<CompetitorAd[]> {
  const supabase = await createClient();
  let q = marketingSchema(supabase)
    .from("competitor_ads")
    .select(
      "id, competitor_id, ad_archive_id, ad_creative_body, ad_creative_link_caption, ad_delivery_start_time, ad_delivery_stop_time, ad_snapshot_url, funding_entity, page_name, status, platforms, snapshot_date",
    )
    .order("ad_delivery_start_time", { ascending: false, nullsFirst: false });
  if (competitorId) q = q.eq("competitor_id", competitorId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as CompetitorAd[];
}

export async function getCompetitorNews(
  competitorId?: string,
  days?: number,
): Promise<CompetitorNews[]> {
  const supabase = await createClient();
  let q = marketingSchema(supabase)
    .from("competitor_news")
    .select(
      "id, competitor_id, article_url, title, published_at, source_name, description, thumbnail_url, favicon_url",
    )
    .order("published_at", { ascending: false, nullsFirst: false });
  if (competitorId) q = q.eq("competitor_id", competitorId);
  if (days) q = q.gte("published_at", sinceDate(days));
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as CompetitorNews[];
}

export async function getCompetitorReviews(
  competitorId?: string,
  rating?: number,
): Promise<CompetitorReview[]> {
  const supabase = await createClient();
  let q = marketingSchema(supabase)
    .from("competitor_reviews")
    .select(
      "id, competitor_id, review_id, rating, texto, autor_nome, imagem_autor_url, data_publicacao, url",
    )
    .order("data_publicacao", { ascending: false, nullsFirst: false });
  if (competitorId) q = q.eq("competitor_id", competitorId);
  if (rating) q = q.eq("rating", rating);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as CompetitorReview[];
}

// ---------------------------------------------------------------------------
// Perfil consolidado (drill-down)
// ---------------------------------------------------------------------------

export async function getCompetitorProfile(
  id: string,
): Promise<CompetitorProfile | null> {
  const supabase = await createClient();
  const { data: comp, error } = await marketingSchema(supabase)
    .from("competitors")
    .select(COMPETITOR_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!comp) return null;
  const competitor = comp as unknown as Competitor;

  const [
    overviewRows,
    subscribersTrend,
    followersTrend,
    recentVideos,
    recentPosts,
    reviews,
    news,
    ads,
  ] = await Promise.all([
    marketingSchema(supabase)
      .from("v_competitors_overview")
      .select("*")
      .eq("id", id)
      .maybeSingle(),
    getSubscribersTrend(id),
    getIgFollowersTrend(id),
    getYoutubeVideos(id, 12),
    getIgPosts(id, 12),
    getCompetitorReviews(id),
    getCompetitorNews(id),
    getCompetitorAds(id),
  ]);

  // Ranking de busca por nome (join por texto).
  const { data: kwData } = await marketingSchema(supabase)
    .from("competitor_keyword_rankings")
    .select("data_referencia, keyword, competitor_name, position, url, title")
    .eq("competitor_name", competitor.name)
    .order("data_referencia", { ascending: false })
    .limit(50);

  return {
    competitor,
    overview: (overviewRows.data as unknown as CompetitorProfile["overview"]) ?? null,
    subscribersTrend,
    followersTrend,
    recentVideos,
    recentPosts,
    reviews,
    news,
    ads,
    keywordRankings: (kwData ?? []) as unknown as KeywordRanking[],
  };
}
