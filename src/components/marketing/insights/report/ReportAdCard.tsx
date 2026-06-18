import Link from "next/link";
import { ExternalLink, Megaphone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  ReportEntityKpis,
  type Kpi,
} from "@/components/marketing/insights/report/ReportEntityKpis";
import { AD_PLATFORMS } from "@/lib/constants/marketing-ads";
import { brl, int, pct } from "@/lib/marketing/ad-spend";
import type { EnrichedAd, MelhorCampanha } from "@/types/marketing-insights";
import type { AdPlatformSlug } from "@/types/marketing-ads";

function buildKpis(
  platform: AdPlatformSlug,
  campanha: MelhorCampanha,
  enriched?: EnrichedAd,
): Kpi[] {
  if (platform === "meta_ads" && enriched) {
    const ctr =
      enriched.impressions > 0
        ? Math.round((enriched.clicks / enriched.impressions) * 10000) / 100
        : null;
    return [
      { label: "Investimento", value: brl(enriched.spend), primary: true },
      { label: "Impressões", value: int(enriched.impressions) },
      { label: "Cliques", value: int(enriched.clicks) },
      { label: "CTR", value: pct(ctr) },
      { label: "Leads", value: int(enriched.leads) },
    ];
  }
  const kpis: Kpi[] = [];
  if (campanha.custo != null)
    kpis.push({ label: "Investimento", value: brl(campanha.custo), primary: true });
  if (campanha.resultado_principal != null)
    kpis.push({ label: "Resultado", value: int(campanha.resultado_principal) });
  return kpis;
}

/** Card da melhor campanha/anúncio do relatório de mídia paga (Seção 6-B.5). */
export function ReportAdCard({
  platform,
  campanha,
  enriched,
}: {
  platform: AdPlatformSlug;
  campanha: MelhorCampanha;
  enriched?: EnrichedAd;
}) {
  const meta = AD_PLATFORMS[platform];
  const nome = enriched?.campaign_name ?? campanha.nome ?? `Campanha no ${meta.name}`;
  const campaignDetailHref = campanha.campaign_id
    ? `/modulos/marketing/midia-paga/campanha/${meta.routeSlug}/${campanha.campaign_id}`
    : null;

  return (
    <Card>
      <CardContent className="flex gap-3 p-3">
        <div
          className="flex h-20 w-20 shrink-0 items-center justify-center rounded-md border"
          style={{ backgroundColor: `${meta.color}1a` }}
        >
          <Megaphone className="h-7 w-7" style={{ color: meta.color }} />
        </div>
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-center gap-1 text-xs font-medium">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: meta.color }}
            />
            {meta.name}
          </div>
          <p className="line-clamp-2 text-sm font-medium">{nome}</p>
          {campanha.objetivo && (
            <p className="text-xs text-muted-foreground">Objetivo: {campanha.objetivo}</p>
          )}

          <ReportEntityKpis items={buildKpis(platform, campanha, enriched)} />

          {campaignDetailHref && (
            <Link
              href={campaignDetailHref}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              Ver campanha <ExternalLink className="h-3 w-3" />
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
