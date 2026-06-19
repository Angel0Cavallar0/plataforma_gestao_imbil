import { createClient } from "@/lib/supabase/server";
import { marketingSchema } from "@/lib/supabase/marketing";
import type {
  EnrichedAd,
  EnrichedPost,
  ReportEnrichment,
  ReportEntityRef,
  ReportJson,
} from "@/types/marketing-insights";

function num(v: number | null | undefined): number {
  return v == null || Number.isNaN(Number(v)) ? 0 : Number(v);
}

/** Coleta os IDs de posts/anúncios referenciados no report_json (Seção 6-B.3). */
function collectIds(report: ReportJson) {
  const igIds = new Set<string>();
  const fbIds = new Set<string>();
  const metaAdIds = new Set<string>();

  const addPost = (ref?: ReportEntityRef, platformHint?: string) => {
    if (!ref?.id) return;
    const plat = (ref.plataforma ?? platformHint ?? "").toLowerCase();
    if (plat === "instagram") igIds.add(ref.id);
    else if (plat === "facebook") fbIds.add(ref.id);
  };

  for (const tp of report.top_posts ?? []) addPost(tp);
  addPost(report.organico?.instagram?.top_post, "instagram");
  addPost(report.organico?.facebook?.top_post, "facebook");

  const metaAd = report.pago?.meta_ads?.melhor_campanha?.ad_id;
  if (metaAd) metaAdIds.add(metaAd);

  return { igIds: [...igIds], fbIds: [...fbIds], metaAdIds: [...metaAdIds] };
}

/**
 * Cruza os IDs do relatório com as tabelas de origem para enriquecer os cards
 * (thumbnail, legenda, link, KPIs). Métricas de post são cumulativas → MAX;
 * Meta Ads é gasto diário → SUM. Em lote para evitar N+1.
 */
export async function enrichReportEntities(
  report: ReportJson | null,
): Promise<ReportEnrichment> {
  const empty: ReportEnrichment = { posts: {}, ads: {} };
  if (!report) return empty;

  const { igIds, fbIds, metaAdIds } = collectIds(report);
  if (igIds.length === 0 && fbIds.length === 0 && metaAdIds.length === 0) {
    return empty;
  }

  const supabase = await createClient();
  const mk = marketingSchema(supabase);

  const [igRes, fbRes, metaRes] = await Promise.all([
    igIds.length
      ? mk
          .from("instagram_media_insights")
          .select(
            "media_id, data_referencia, media_type, permalink, media_url, thumbnail_url, caption, reach, impressions, likes, comments, saves, shares, plays, is_boosted, ad_spend",
          )
          .in("media_id", igIds)
      : Promise.resolve({ data: [], error: null }),
    fbIds.length
      ? mk
          .from("facebook_post_insights")
          .select(
            "post_id, data_referencia, post_type, permalink, message, reach, impressions, reactions_total, comments, shares, clicks, is_boosted, ad_spend",
          )
          .in("post_id", fbIds)
      : Promise.resolve({ data: [], error: null }),
    metaAdIds.length
      ? mk
          .from("meta_ads_ad_insights")
          .select(
            "ad_id, campaign_name, ad_name, creative_thumbnail_url, spend, impressions, clicks, leads",
          )
          .in("ad_id", metaAdIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (igRes.error) throw igRes.error;
  if (fbRes.error) throw fbRes.error;
  if (metaRes.error) throw metaRes.error;

  const posts: Record<string, EnrichedPost> = {};

  // Instagram — manter a linha mais recente por media_id (cumulativo).
  const igLatest = new Map<string, Record<string, unknown>>();
  for (const r of (igRes.data ?? []) as Array<Record<string, unknown>>) {
    const id = r.media_id as string;
    const cur = igLatest.get(id);
    if (!cur || (r.data_referencia as string) >= (cur.data_referencia as string)) {
      igLatest.set(id, r);
    }
  }
  for (const [id, r] of igLatest) {
    posts[id] = {
      id,
      network: "instagram",
      media_type: (r.media_type as string) ?? null,
      permalink: (r.permalink as string) ?? null,
      thumbnail_url: ((r.thumbnail_url as string) || (r.media_url as string)) ?? null,
      caption: (r.caption as string) ?? null,
      reach: num(r.reach as number),
      impressions: num(r.impressions as number),
      likes: num(r.likes as number),
      comments: num(r.comments as number),
      saves: num(r.saves as number),
      shares: num(r.shares as number),
      plays: num(r.plays as number),
      reactions: 0,
      clicks: 0,
      is_boosted: Boolean(r.is_boosted),
      ad_spend: r.ad_spend == null ? null : Number(r.ad_spend),
    };
  }

  // Facebook — manter a linha mais recente por post_id.
  const fbLatest = new Map<string, Record<string, unknown>>();
  for (const r of (fbRes.data ?? []) as Array<Record<string, unknown>>) {
    const id = r.post_id as string;
    const cur = fbLatest.get(id);
    if (!cur || (r.data_referencia as string) >= (cur.data_referencia as string)) {
      fbLatest.set(id, r);
    }
  }
  for (const [id, r] of fbLatest) {
    posts[id] = {
      id,
      network: "facebook",
      media_type: (r.post_type as string) ?? null,
      permalink: (r.permalink as string) ?? null,
      thumbnail_url: null,
      caption: (r.message as string) ?? null,
      reach: num(r.reach as number),
      impressions: num(r.impressions as number),
      likes: num(r.reactions_total as number),
      comments: num(r.comments as number),
      saves: 0,
      shares: num(r.shares as number),
      plays: 0,
      reactions: num(r.reactions_total as number),
      clicks: num(r.clicks as number),
      is_boosted: Boolean(r.is_boosted),
      ad_spend: r.ad_spend == null ? null : Number(r.ad_spend),
    };
  }

  // Meta Ads — soma diária por ad_id.
  const ads: Record<string, EnrichedAd> = {};
  for (const r of (metaRes.data ?? []) as Array<Record<string, unknown>>) {
    const id = r.ad_id as string;
    const acc =
      ads[id] ??
      ({
        ad_id: id,
        campaign_name: (r.campaign_name as string) ?? null,
        ad_name: (r.ad_name as string) ?? null,
        thumbnail_url: (r.creative_thumbnail_url as string) ?? null,
        spend: 0,
        impressions: 0,
        clicks: 0,
        leads: 0,
      } as EnrichedAd);
    acc.spend += num(r.spend as number);
    acc.impressions += num(r.impressions as number);
    acc.clicks += num(r.clicks as number);
    acc.leads += num(r.leads as number);
    if (!acc.thumbnail_url && r.creative_thumbnail_url)
      acc.thumbnail_url = r.creative_thumbnail_url as string;
    ads[id] = acc;
  }

  return { posts, ads };
}
