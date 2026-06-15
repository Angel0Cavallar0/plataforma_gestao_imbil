import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { brl, pct, roasLabel } from "@/lib/marketing/ad-spend";
import { ConversionHeaderInfo } from "@/components/marketing/ad-spend/shared/ConversionHeaderInfo";
import type { OverviewKpis } from "@/types/marketing-ads";

/** 4 KPIs consolidados da visão geral (Seção 6.1). */
export function OverviewKpiCards({ kpis }: { kpis: OverviewKpis }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Investimento total
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold">{brl(kpis.spend_total)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
            Custo por resultado
            <ConversionHeaderInfo />
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
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Taxa de conversão
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold">{pct(kpis.conversion_rate_pct)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle
            className="text-sm font-medium text-muted-foreground"
            title="Calculado apenas sobre plataformas com valor de conversão (Meta + Google)."
          >
            ROAS (Meta + Google)
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
