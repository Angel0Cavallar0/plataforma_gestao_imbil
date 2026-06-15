import Link from "next/link";
import { brl, int, pct } from "@/lib/marketing/ad-spend";
import { RoasCell } from "@/components/marketing/ad-spend/shared/RoasCell";
import { ConversionHeaderInfo } from "@/components/marketing/ad-spend/shared/ConversionHeaderInfo";
import { OpenAdsManagerButton } from "@/components/marketing/ad-spend/shared/OpenAdsManagerButton";
import { AD_PLATFORMS } from "@/lib/constants/marketing-ads";
import type { AdPlatformSlug, CampaignRow } from "@/types/marketing-ads";

/** Tabela de campanhas da plataforma + deep links (Seção 9.4). */
export function PlatformCampaignsTable({
  platformSlug,
  campaigns,
}: {
  platformSlug: AdPlatformSlug;
  campaigns: CampaignRow[];
}) {
  if (campaigns.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        Nenhuma campanha com dados no período selecionado.
      </p>
    );
  }

  const sorted = [...campaigns].sort((a, b) => b.spend - a.spend);

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-3 py-2">Campanha</th>
            <th className="px-3 py-2 text-right">Impressões</th>
            <th className="px-3 py-2 text-right">Cliques</th>
            <th className="px-3 py-2 text-right">Investimento</th>
            <th className="px-3 py-2 text-right">
              Conversões <ConversionHeaderInfo />
            </th>
            <th className="px-3 py-2 text-right">CTR</th>
            <th className="px-3 py-2 text-right">CPC</th>
            <th className="px-3 py-2 text-right">Custo/conv.</th>
            <th className="px-3 py-2 text-right">ROAS</th>
            <th className="px-3 py-2 text-right">Ações</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr key={row.external_campaign_id} className="border-t">
              <td className="px-3 py-2 font-medium">
                <Link
                  href={`/modulos/marketing/midia-paga/campanha/${AD_PLATFORMS[platformSlug].routeSlug}/${encodeURIComponent(row.external_campaign_id)}`}
                  className="hover:underline"
                >
                  {row.campaign_name ?? row.external_campaign_id}
                </Link>
              </td>
              <td className="px-3 py-2 text-right tabular-nums">
                {int(row.impressions)}
              </td>
              <td className="px-3 py-2 text-right tabular-nums">{int(row.clicks)}</td>
              <td className="px-3 py-2 text-right tabular-nums">{brl(row.spend)}</td>
              <td className="px-3 py-2 text-right tabular-nums">
                {int(row.conversions)}
              </td>
              <td className="px-3 py-2 text-right tabular-nums">{pct(row.ctr_pct)}</td>
              <td className="px-3 py-2 text-right tabular-nums">{brl(row.cpc)}</td>
              <td className="px-3 py-2 text-right tabular-nums">
                {brl(row.cost_per_conversion)}
              </td>
              <td className="px-3 py-2 text-right">
                <RoasCell platformSlug={platformSlug} roas={row.roas} />
              </td>
              <td className="px-3 py-2 text-right">
                <OpenAdsManagerButton
                  platformSlug={platformSlug}
                  level="campaign"
                  ids={{ campaignId: row.external_campaign_id }}
                  label="Gerenciador"
                  variant="ghost"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
