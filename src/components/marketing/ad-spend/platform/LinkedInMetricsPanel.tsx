import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { int, pct } from "@/lib/marketing/ad-spend";
import { MetricInfo } from "@/components/marketing/ad-spend/shared/MetricInfo";
import { LINKEDIN_TOOLTIPS } from "@/lib/constants/midia-paga-tooltips";
import type { LinkedInSummary } from "@/lib/marketing/platform-metrics";

/** Painel de métricas exclusivas do LinkedIn (Seção 6.4). */
export function LinkedInMetricsPanel({ summary }: { summary: LinkedInSummary }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-sm">
            Engajamento social
            <MetricInfo text={LINKEDIN_TOOLTIPS.social_engagement} />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Curtidas</dt>
            <dd className="text-right tabular-nums">{int(summary.likes)}</dd>
            <dt className="text-muted-foreground">Comentários</dt>
            <dd className="text-right tabular-nums">{int(summary.comments)}</dd>
            <dt className="text-muted-foreground">Compartilhamentos</dt>
            <dd className="text-right tabular-nums">{int(summary.shares)}</dd>
            <dt className="text-muted-foreground">Novos seguidores</dt>
            <dd className="text-right tabular-nums">{int(summary.follows)}</dd>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Lead Gen Forms</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Aberturas do formulário</dt>
            <dd className="text-right tabular-nums">
              {int(summary.lead_gen_form_opens)}
            </dd>
            <dt className="flex items-center text-muted-foreground">
              Envios
              <MetricInfo text={LINKEDIN_TOOLTIPS.lead_gen_submissions} />
            </dt>
            <dd className="text-right tabular-nums">
              {int(summary.lead_gen_submissions)}
            </dd>
            <dt className="flex items-center text-muted-foreground">
              Taxa de conclusão
              <MetricInfo text={LINKEDIN_TOOLTIPS.completion_rate} />
            </dt>
            <dd className="text-right tabular-nums">
              {pct(summary.form_completion_rate)}
            </dd>
            <dt className="text-muted-foreground">Conversões no site</dt>
            <dd className="text-right tabular-nums">
              {int(summary.external_website_conversions)}
            </dd>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
