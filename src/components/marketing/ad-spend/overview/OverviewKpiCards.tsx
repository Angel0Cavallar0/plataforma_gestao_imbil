import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { brl, pct, roasLabel } from "@/lib/marketing/ad-spend";
import { ConversionHeaderInfo } from "@/components/marketing/ad-spend/shared/ConversionHeaderInfo";
import { MetricInfo } from "@/components/marketing/ad-spend/shared/MetricInfo";
import { OVERVIEW_TOOLTIPS } from "@/lib/constants/midia-paga-tooltips";
import type { OverviewKpis } from "@/types/marketing-ads";

/** 4 KPIs consolidados da visão geral (Seção 6.1). */
export function OverviewKpiCards({ kpis }: { kpis: OverviewKpis }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center text-sm font-medium text-muted-foreground">
            Investimento total
            <MetricInfo text={OVERVIEW_TOOLTIPS.spend_total} />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold">{brl(kpis.spend_total)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center text-sm font-medium text-muted-foreground">
            Custo por resultado
            <ConversionHeaderInfo />
            <MetricInfo text={OVERVIEW_TOOLTIPS.cost_per_conversion} />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold">{brl(kpis.cost_per_conversion)}</p>
          <p className="text-xs text-muted-foreground">
            {kpis.conversions_total.toLocaleString("pt-BR")} resultados
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center text-sm font-medium text-muted-foreground">
            Taxa de conversão
            <MetricInfo text={OVERVIEW_TOOLTIPS.conversion_rate} />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold">{pct(kpis.conversion_rate_pct)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center text-sm font-medium text-muted-foreground">
            ROAS (Meta + Google)
            <MetricInfo text={OVERVIEW_TOOLTIPS.roas} />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold">{roasLabel(kpis.roas)}</p>
          {kpis.spend_without_value > 0 && (
            <p className="text-xs text-muted-foreground">
              + {brl(kpis.spend_without_value)} no LinkedIn sem retorno mensurável
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
