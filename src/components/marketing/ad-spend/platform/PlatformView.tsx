import { PaidMediaTabs } from "@/components/marketing/ad-spend/PaidMediaTabs";
import { AdSpendFilters } from "@/components/marketing/ad-spend/AdSpendFilters";
import { OpenAdsManagerButton } from "@/components/marketing/ad-spend/shared/OpenAdsManagerButton";
import { PlatformKpiHeader } from "@/components/marketing/ad-spend/platform/PlatformKpiHeader";
import { MetaMetricsPanel } from "@/components/marketing/ad-spend/platform/MetaMetricsPanel";
import { GoogleMetricsPanel } from "@/components/marketing/ad-spend/platform/GoogleMetricsPanel";
import { LinkedInMetricsPanel } from "@/components/marketing/ad-spend/platform/LinkedInMetricsPanel";
import { PlatformCampaignsTable } from "@/components/marketing/ad-spend/platform/PlatformCampaignsTable";
import type { StatTile } from "@/components/marketing/ad-spend/platform/PlatformKpiHeader";
import { AD_PLATFORMS } from "@/lib/constants/marketing-ads";
import { brl, int, pct, roasLabel } from "@/lib/marketing/ad-spend";
import {
  aggregateGoogle,
  aggregateLinkedIn,
  aggregateMeta,
} from "@/lib/marketing/platform-metrics";
import { getCampaigns, getPlatformCampaigns } from "@/server/queries/marketing/ad-spend";
import {
  GOOGLE_TOOLTIPS,
  LINKEDIN_TOOLTIPS,
  META_TOOLTIPS,
} from "@/lib/constants/midia-paga-tooltips";
import type { AdPlatformSlug, AdSpendFilters as Filters } from "@/types/marketing-ads";

export async function PlatformView({
  platformSlug,
  filters,
}: {
  platformSlug: AdPlatformSlug;
  filters: Filters;
}) {
  const meta = AD_PLATFORMS[platformSlug];
  const scopedFilters: Filters = { ...filters, platforms: [platformSlug] };

  const [rawRows, campaigns] = await Promise.all([
    getPlatformCampaigns(platformSlug, scopedFilters),
    getCampaigns(scopedFilters),
  ]);

  let tiles: StatTile[];
  let panel: React.ReactNode;

  if (platformSlug === "meta_ads") {
    const s = aggregateMeta(rawRows);
    tiles = [
      { label: "Investimento", value: brl(s.spend), info: META_TOOLTIPS.investment },
      { label: "Impressões", value: int(s.impressions), info: META_TOOLTIPS.impressions },
      {
        label: "Alcance",
        value: int(s.reach),
        hint: s.frequency != null ? `frequência ${s.frequency}` : undefined,
        info: META_TOOLTIPS.reach,
      },
      {
        label: "Landing page views",
        value: int(s.landing_page_views),
        info: META_TOOLTIPS.landing_page_views,
      },
      {
        label: "Cliques",
        value: int(s.clicks),
        hint: `CTR ${pct(s.ctr)}`,
        info: META_TOOLTIPS.clicks,
      },
      {
        label: "Conversões (leads)",
        value: int(s.leads),
        info: META_TOOLTIPS.conversions,
      },
      {
        label: "Engajamento",
        value: int(s.post_engagement),
        info: META_TOOLTIPS.engagement,
      },
      {
        label: "ROAS",
        value: roasLabel(s.roas),
        info: META_TOOLTIPS.roas,
      },
    ];
    panel = <MetaMetricsPanel summary={s} />;
  } else if (platformSlug === "google_ads") {
    const s = aggregateGoogle(rawRows);
    tiles = [
      { label: "Investimento", value: brl(s.spend), info: GOOGLE_TOOLTIPS.investment },
      {
        label: "Impressões",
        value: int(s.impressions),
        info: GOOGLE_TOOLTIPS.impressions,
      },
      {
        label: "Cliques",
        value: int(s.clicks),
        hint: `CTR ${pct(s.ctr)}`,
        info: GOOGLE_TOOLTIPS.clicks,
      },
      {
        label: "Conversões",
        value: int(s.conversions),
        hint: `custo/conv. ${brl(s.cost_per_conversion)}`,
        info: GOOGLE_TOOLTIPS.conversions,
      },
      {
        label: "Impression Share",
        value: pct(s.search_impression_share),
        info: GOOGLE_TOOLTIPS.impression_share,
      },
      {
        label: "Perdido por orçamento",
        value: pct(s.search_budget_lost_is),
        info: GOOGLE_TOOLTIPS.lost_budget,
      },
      {
        label: "Perdido por ranking",
        value: pct(s.search_rank_lost_is),
        info: GOOGLE_TOOLTIPS.lost_rank,
      },
      {
        label: "ROAS",
        value: roasLabel(
          s.spend > 0 && s.conversions_value > 0
            ? Math.round((s.conversions_value / s.spend) * 100) / 100
            : null,
        ),
        info: GOOGLE_TOOLTIPS.roas,
      },
    ];
    panel = <GoogleMetricsPanel summary={s} />;
  } else {
    const s = aggregateLinkedIn(rawRows);
    tiles = [
      { label: "Investimento", value: brl(s.spend), info: LINKEDIN_TOOLTIPS.investment },
      {
        label: "Impressões",
        value: int(s.impressions),
        info: LINKEDIN_TOOLTIPS.impressions,
      },
      { label: "Alcance", value: int(s.reach), info: LINKEDIN_TOOLTIPS.reach },
      {
        label: "Cliques",
        value: int(s.clicks),
        hint: `CTR ${pct(s.ctr)}`,
        info: LINKEDIN_TOOLTIPS.clicks,
      },
      {
        label: "Envios de Lead Gen",
        value: int(s.lead_gen_submissions),
        info: LINKEDIN_TOOLTIPS.lead_gen_submissions,
      },
      {
        label: "Taxa de conclusão",
        value: pct(s.form_completion_rate),
        hint: `${int(s.lead_gen_form_opens)} aberturas`,
        info: LINKEDIN_TOOLTIPS.completion_rate,
      },
      {
        label: "Engajamento social",
        value: int(s.likes + s.comments + s.shares + s.follows),
        hint: "likes + comentários + shares + follows",
        info: LINKEDIN_TOOLTIPS.social_engagement,
      },
      {
        label: "ROAS",
        value: "—",
        info: LINKEDIN_TOOLTIPS.roas,
      },
    ];
    panel = <LinkedInMetricsPanel summary={s} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            <span
              className="inline-block h-4 w-4 rounded-full"
              style={{ backgroundColor: meta.color }}
            />
            {meta.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            Métricas específicas e campanhas da plataforma.
          </p>
        </div>
        <OpenAdsManagerButton
          platformSlug={platformSlug}
          level="account"
          variant="outline"
        />
      </div>

      <PaidMediaTabs />
      <AdSpendFilters filters={filters} showPlatformFilter={false} />

      <PlatformKpiHeader tiles={tiles} />
      {panel}

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Campanhas</h2>
        <PlatformCampaignsTable platformSlug={platformSlug} campaigns={campaigns} />
      </div>
    </div>
  );
}
