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
      { label: "Investimento", value: brl(s.spend) },
      { label: "Impressões", value: int(s.impressions) },
      {
        label: "Alcance",
        value: int(s.reach),
        hint: s.frequency != null ? `frequência ${s.frequency}` : undefined,
      },
      { label: "Landing page views", value: int(s.landing_page_views) },
      { label: "Cliques", value: int(s.clicks), hint: `CTR ${pct(s.ctr)}` },
      {
        label: "Conversões (leads)",
        value: int(s.leads),
        title: meta.conversionLabel,
      },
      { label: "Engajamento", value: int(s.post_engagement) },
      {
        label: "ROAS",
        value: roasLabel(s.roas),
        title: "conversion_value / spend",
      },
    ];
    panel = <MetaMetricsPanel summary={s} />;
  } else if (platformSlug === "google_ads") {
    const s = aggregateGoogle(rawRows);
    tiles = [
      { label: "Investimento", value: brl(s.spend) },
      { label: "Impressões", value: int(s.impressions) },
      { label: "Cliques", value: int(s.clicks), hint: `CTR ${pct(s.ctr)}` },
      {
        label: "Conversões",
        value: int(s.conversions),
        hint: `custo/conv. ${brl(s.cost_per_conversion)}`,
      },
      {
        label: "Impression Share",
        value: pct(s.search_impression_share),
        title: "Search Impression Share médio (ponderado por impressões).",
      },
      {
        label: "Perdido por orçamento",
        value: pct(s.search_budget_lost_is),
      },
      { label: "Perdido por ranking", value: pct(s.search_rank_lost_is) },
      {
        label: "ROAS",
        value: roasLabel(
          s.spend > 0 && s.conversions_value > 0
            ? Math.round((s.conversions_value / s.spend) * 100) / 100
            : null,
        ),
      },
    ];
    panel = <GoogleMetricsPanel summary={s} />;
  } else {
    const s = aggregateLinkedIn(rawRows);
    tiles = [
      { label: "Investimento", value: brl(s.spend) },
      { label: "Impressões", value: int(s.impressions) },
      { label: "Alcance", value: int(s.reach) },
      { label: "Cliques", value: int(s.clicks), hint: `CTR ${pct(s.ctr)}` },
      {
        label: "Envios de Lead Gen",
        value: int(s.lead_gen_submissions),
        title: meta.conversionLabel,
      },
      {
        label: "Taxa de conclusão",
        value: pct(s.form_completion_rate),
        hint: `${int(s.lead_gen_form_opens)} aberturas`,
      },
      {
        label: "Engajamento social",
        value: int(s.likes + s.comments + s.shares + s.follows),
        hint: "likes + comentários + shares + follows",
      },
      {
        label: "ROAS",
        value: "—",
        title: "LinkedIn não fornece valor de conversão; ROAS indisponível.",
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
