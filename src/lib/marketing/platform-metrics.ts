/**
 * Agregadores das métricas específicas de cada plataforma (Seção 6.4).
 * Recebem as linhas brutas (ad/creative × dia) das tabelas base e devolvem
 * um resumo no período. Mantidos puros para facilitar teste.
 */

function n(row: Record<string, unknown>, key: string): number {
  const v = row[key];
  return v == null || Number.isNaN(Number(v)) ? 0 : Number(v);
}

export type MetaSummary = {
  spend: number;
  impressions: number;
  reach: number;
  frequency: number | null;
  clicks: number;
  ctr: number | null;
  landing_page_views: number;
  post_engagement: number;
  leads: number;
  conversions_value: number;
  roas: number | null;
  video: { thruplay: number; p25: number; p50: number; p75: number; p100: number };
  rankings: {
    quality: Record<string, number>;
    engagement: Record<string, number>;
    conversion: Record<string, number>;
  };
};

export function aggregateMeta(rows: Record<string, unknown>[]): MetaSummary {
  let spend = 0,
    impressions = 0,
    reach = 0,
    clicks = 0,
    lpv = 0,
    engagement = 0,
    leads = 0,
    value = 0;
  const video = { thruplay: 0, p25: 0, p50: 0, p75: 0, p100: 0 };
  const quality: Record<string, number> = {};
  const eng: Record<string, number> = {};
  const conv: Record<string, number> = {};

  // Rankings só fazem sentido no estado mais recente de cada anúncio.
  const latestByAd = new Map<string, Record<string, unknown>>();

  for (const r of rows) {
    spend += n(r, "spend");
    impressions += n(r, "impressions");
    reach += n(r, "reach");
    clicks += n(r, "clicks");
    lpv += n(r, "landing_page_views");
    engagement += n(r, "post_engagement");
    leads += n(r, "leads") || n(r, "pixel_lead");
    value += n(r, "conversion_value") || n(r, "purchase_value") || n(r, "lead_value");
    video.thruplay += n(r, "video_thruplay_watched");
    video.p25 += n(r, "video_p25_watched");
    video.p50 += n(r, "video_p50_watched");
    video.p75 += n(r, "video_p75_watched");
    video.p100 += n(r, "video_p100_watched");

    const adId = String(r.ad_id ?? "");
    const day = String(r.data_referencia ?? "");
    const prev = latestByAd.get(adId);
    if (!prev || String(prev.data_referencia ?? "") < day) latestByAd.set(adId, r);
  }

  for (const r of latestByAd.values()) {
    const q = r.quality_ranking as string | null;
    const e = r.engagement_rate_ranking as string | null;
    const c = r.conversion_rate_ranking as string | null;
    if (q) quality[q] = (quality[q] ?? 0) + 1;
    if (e) eng[e] = (eng[e] ?? 0) + 1;
    if (c) conv[c] = (conv[c] ?? 0) + 1;
  }

  return {
    spend,
    impressions,
    reach,
    frequency: reach > 0 ? Math.round((impressions / reach) * 100) / 100 : null,
    clicks,
    ctr: impressions > 0 ? Math.round((clicks / impressions) * 10000) / 100 : null,
    landing_page_views: lpv,
    post_engagement: engagement,
    leads,
    conversions_value: value,
    roas: spend > 0 && value > 0 ? Math.round((value / spend) * 100) / 100 : null,
    video,
    rankings: { quality, engagement: eng, conversion: conv },
  };
}

export type GoogleSummary = {
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number | null;
  conversions: number;
  conversions_value: number;
  cost_per_conversion: number | null;
  search_impression_share: number | null;
  search_budget_lost_is: number | null;
  search_rank_lost_is: number | null;
  cpv: number | null;
  video_views: number;
  videoQuartiles: { p25: number; p50: number; p75: number; p100: number } | null;
};

function weightedAvg(
  rows: Record<string, unknown>[],
  valueKey: string,
  weightKey: string,
): number | null {
  let num = 0;
  let den = 0;
  for (const r of rows) {
    const v = r[valueKey];
    if (v == null) continue;
    const w = n(r, weightKey);
    num += Number(v) * w;
    den += w;
  }
  return den > 0 ? Math.round((num / den) * 10000) / 100 : null;
}

export function aggregateGoogle(rows: Record<string, unknown>[]): GoogleSummary {
  let spend = 0,
    impressions = 0,
    clicks = 0,
    conversions = 0,
    value = 0,
    videoViews = 0;
  const q = { p25: 0, p50: 0, p75: 0, p100: 0 };
  let hasVideoQuartiles = false;

  for (const r of rows) {
    spend += n(r, "cost");
    impressions += n(r, "impressions");
    clicks += n(r, "clicks");
    conversions += n(r, "conversions");
    value += n(r, "conversions_value");
    videoViews += n(r, "video_views");
    if (r.video_quartile_p25_rate != null) {
      hasVideoQuartiles = true;
      q.p25 += n(r, "video_quartile_p25_rate");
      q.p50 += n(r, "video_quartile_p50_rate");
      q.p75 += n(r, "video_quartile_p75_rate");
      q.p100 += n(r, "video_quartile_p100_rate");
    }
  }

  const len = rows.length || 1;

  return {
    spend,
    impressions,
    clicks,
    ctr: impressions > 0 ? Math.round((clicks / impressions) * 10000) / 100 : null,
    conversions,
    conversions_value: value,
    cost_per_conversion:
      conversions > 0 ? Math.round((spend / conversions) * 100) / 100 : null,
    // Impression share é fração [0..1]; pondera por impressões.
    search_impression_share: weightedAvg(rows, "search_impression_share", "impressions"),
    search_budget_lost_is: weightedAvg(
      rows,
      "search_budget_lost_impression_share",
      "impressions",
    ),
    search_rank_lost_is: weightedAvg(
      rows,
      "search_rank_lost_impression_share",
      "impressions",
    ),
    cpv: videoViews > 0 ? Math.round((spend / videoViews) * 100) / 100 : null,
    video_views: videoViews,
    videoQuartiles: hasVideoQuartiles
      ? {
          p25: Math.round((q.p25 / len) * 100) / 100,
          p50: Math.round((q.p50 / len) * 100) / 100,
          p75: Math.round((q.p75 / len) * 100) / 100,
          p100: Math.round((q.p100 / len) * 100) / 100,
        }
      : null,
  };
}

export type LinkedInSummary = {
  spend: number;
  impressions: number;
  reach: number;
  clicks: number;
  ctr: number | null;
  likes: number;
  comments: number;
  shares: number;
  follows: number;
  lead_gen_form_opens: number;
  lead_gen_submissions: number;
  form_completion_rate: number | null;
  external_website_conversions: number;
  video: { views: number; p25: number; p50: number; p75: number; p100: number };
};

export function aggregateLinkedIn(rows: Record<string, unknown>[]): LinkedInSummary {
  let spend = 0,
    impressions = 0,
    reach = 0,
    clicks = 0,
    likes = 0,
    comments = 0,
    shares = 0,
    follows = 0,
    opens = 0,
    submissions = 0,
    extConv = 0;
  const video = { views: 0, p25: 0, p50: 0, p75: 0, p100: 0 };

  for (const r of rows) {
    spend += n(r, "spend");
    impressions += n(r, "impressions");
    reach += n(r, "reach");
    clicks += n(r, "clicks");
    likes += n(r, "likes");
    comments += n(r, "comments");
    shares += n(r, "shares");
    follows += n(r, "follows");
    opens += n(r, "lead_gen_form_opens");
    submissions += n(r, "lead_gen_submissions");
    extConv += n(r, "external_website_conversions");
    video.views += n(r, "video_views");
    video.p25 += n(r, "video_25_completions");
    video.p50 += n(r, "video_50_completions");
    video.p75 += n(r, "video_75_completions");
    video.p100 += n(r, "video_100_completions");
  }

  return {
    spend,
    impressions,
    reach,
    clicks,
    ctr: impressions > 0 ? Math.round((clicks / impressions) * 10000) / 100 : null,
    likes,
    comments,
    shares,
    follows,
    lead_gen_form_opens: opens,
    lead_gen_submissions: submissions,
    form_completion_rate:
      opens > 0 ? Math.round((submissions / opens) * 10000) / 100 : null,
    external_website_conversions: extConv,
    video,
  };
}
