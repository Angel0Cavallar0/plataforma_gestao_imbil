import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { brl, int } from "@/lib/marketing/ad-spend";
import { AD_PLATFORMS, AD_PLATFORM_SLUGS } from "@/lib/constants/marketing-ads";
import { OpenAdsManagerButton } from "@/components/marketing/ad-spend/shared/OpenAdsManagerButton";
import { RoasCell } from "@/components/marketing/ad-spend/shared/RoasCell";
import type { PlatformSummary } from "@/types/marketing-ads";

/** 3 cards (Meta/Google/LinkedIn) + botão para o gerenciador (nível conta). */
export function PlatformSplitCards({ split }: { split: PlatformSummary[] }) {
  const byPlatform = new Map(split.map((s) => [s.platform_slug, s]));

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {AD_PLATFORM_SLUGS.map((slug) => {
        const meta = AD_PLATFORMS[slug];
        const s = byPlatform.get(slug);
        const roas =
          s && meta.hasConversionValue && s.spend > 0 && (s.conversions_value ?? 0) > 0
            ? Math.round(((s.conversions_value ?? 0) / s.spend) * 100) / 100
            : null;

        return (
          <Card key={slug}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <span
                  className="inline-block h-3 w-3 rounded-full"
                  style={{ backgroundColor: meta.color }}
                />
                {meta.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-2xl font-semibold">{brl(s?.spend ?? 0)}</p>
                <p className="text-xs text-muted-foreground">
                  {s ? `${int(s.campaigns_total)} campanhas` : "sem dados no período"}
                </p>
              </div>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                <dt className="text-muted-foreground">Impressões</dt>
                <dd className="text-right tabular-nums">{int(s?.impressions ?? 0)}</dd>
                <dt className="text-muted-foreground">Cliques</dt>
                <dd className="text-right tabular-nums">{int(s?.clicks ?? 0)}</dd>
                <dt className="text-muted-foreground">Conversões</dt>
                <dd className="text-right tabular-nums">{int(s?.conversions ?? 0)}</dd>
                <dt className="text-muted-foreground">ROAS</dt>
                <dd className="text-right">
                  <RoasCell platformSlug={slug} roas={roas} />
                </dd>
              </dl>
              <OpenAdsManagerButton
                platformSlug={slug}
                level="account"
                className="w-full"
              />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
