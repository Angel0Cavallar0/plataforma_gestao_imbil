import { ArrowDownRight, ArrowUpRight, Minus, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ReportPostCard } from "@/components/marketing/insights/report/ReportPostCard";
import { ReportAdCard } from "@/components/marketing/insights/report/ReportAdCard";
import {
  ALERT_URGENCIA_LABEL,
  ALERT_URGENCIA_VARIANT,
  NETWORKS,
} from "@/lib/constants/marketing-insights";
import { AD_PLATFORMS } from "@/lib/constants/marketing-ads";
import { brl, int, pct } from "@/lib/marketing/ad-spend";
import { formatDeltaPct } from "@/lib/marketing/insights";
import type {
  ComparativoPeriodo,
  MarketingReport,
  OrganicNetworkReport,
  PaidPlatformReport,
  ReportAlerta,
  ReportEnrichment,
  ReportEntityRef,
  ReportRecomendacao,
  ReportScope,
} from "@/types/marketing-insights";
import type { AdPlatformSlug } from "@/types/marketing-ads";

function Kv({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}

function ResumoCard({ resumo }: { resumo?: string }) {
  if (!resumo) return null;
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Resumo executivo</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="whitespace-pre-line text-sm text-foreground/90">{resumo}</p>
      </CardContent>
    </Card>
  );
}

function DestaquesList({ destaques }: { destaques?: string[] }) {
  if (!destaques?.length) return null;
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Destaques</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {destaques.map((d, i) => (
            <li key={i} className="flex gap-2 text-sm text-foreground/90">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              {d}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function AlertasList({ alertas }: { alertas?: ReportAlerta[] }) {
  if (!alertas?.length) return null;
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">Alertas</h3>
      <div className="grid gap-3 md:grid-cols-2">
        {alertas.map((a, i) => {
          const urg = a.urgencia ?? "baixa";
          return (
            <Card key={i}>
              <CardContent className="space-y-1 p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">{a.titulo}</p>
                  <Badge variant={ALERT_URGENCIA_VARIANT[urg]}>
                    {ALERT_URGENCIA_LABEL[urg]}
                  </Badge>
                </div>
                {a.descricao && (
                  <p className="text-xs text-muted-foreground">{a.descricao}</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function RecomendacoesList({ recomendacoes }: { recomendacoes?: ReportRecomendacao[] }) {
  if (!recomendacoes?.length) return null;
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">Recomendações</h3>
      <div className="space-y-3">
        {recomendacoes.map((r, i) => (
          <Card key={i}>
            <CardContent className="space-y-1 p-4">
              <p className="text-sm font-medium">{r.acao}</p>
              {r.justificativa && (
                <p className="text-xs text-muted-foreground">{r.justificativa}</p>
              )}
              {r.metrica_base && (
                <p className="text-xs text-muted-foreground/80">Base: {r.metrica_base}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function DeltaRow({ label, value }: { label: string; value?: number | null }) {
  const has = value != null && !Number.isNaN(value);
  const Icon = !has
    ? Minus
    : value! > 0
      ? ArrowUpRight
      : value! < 0
        ? ArrowDownRight
        : Minus;
  return (
    <div className="flex items-center justify-between gap-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="inline-flex items-center gap-1 font-medium tabular-nums">
        {has ? (
          <>
            <Icon className="h-3.5 w-3.5" />
            {formatDeltaPct(value)}
          </>
        ) : (
          <span className="text-muted-foreground">sem base anterior</span>
        )}
      </span>
    </div>
  );
}

function ComparativoCard({
  comparativo,
  rows,
}: {
  comparativo?: ComparativoPeriodo;
  rows: { label: string; key: keyof ComparativoPeriodo }[];
}) {
  if (!comparativo) return null;
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Comparativo com o período anterior</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {rows.map((r) => (
          <DeltaRow key={r.key} label={r.label} value={comparativo[r.key]} />
        ))}
      </CardContent>
    </Card>
  );
}

// --- Orgânico ---------------------------------------------------------------

function OrganicNetworkCard({
  network,
  data,
  enrichment,
}: {
  network: "instagram" | "facebook" | "linkedin";
  data?: OrganicNetworkReport;
  enrichment: ReportEnrichment;
}) {
  if (!data) return null;
  const meta = NETWORKS[network];
  const top = data.top_post;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-1.5 text-sm">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: meta.color }}
          />
          {meta.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          {network === "instagram" && (
            <>
              <Kv label="Alcance" value={int(data.reach)} />
              <Kv label="Impressões" value={int(data.impressions)} />
              <Kv label="Interações" value={int(data.interacoes)} />
              <Kv label="Seguidores ganhos" value={int(data.followers_ganhos)} />
            </>
          )}
          {network === "facebook" && (
            <>
              <Kv label="Fãs (total)" value={int(data.fans_total)} />
              <Kv label="Fãs ganhos" value={int(data.fans_ganhos)} />
              <Kv label="Usuários engajados" value={int(data.engaged_total)} />
              <Kv label="Page views" value={int(data.page_views_total)} />
            </>
          )}
          {network === "linkedin" && (
            <>
              <Kv label="Seguidores (total)" value={int(data.followers_total)} />
              <Kv label="Seguidores ganhos" value={int(data.followers_ganhos)} />
              <Kv label="Impressões" value={int(data.impressoes)} />
              <Kv label="Engajamento" value={int(data.engajamento_total)} />
            </>
          )}
          {data.taxa_engajamento != null && (
            <Kv label="Taxa de engajamento" value={pct(data.taxa_engajamento)} />
          )}
        </div>

        {top?.id && (
          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">
              Melhor post
            </p>
            <ReportPostCard
              entity={{ ...top, plataforma: network }}
              enriched={enrichment.posts[top.id]}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// --- Pago -------------------------------------------------------------------

function GastoTotalCard({
  gasto,
}: {
  gasto?: { meta?: number; google?: number; linkedin?: number; total?: number };
}) {
  if (!gasto) return null;
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Investimento consolidado</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold tabular-nums">{brl(gasto.total)}</p>
        <div className="mt-2 space-y-1">
          <Kv label="Meta Ads" value={brl(gasto.meta)} />
          <Kv label="Google Ads" value={brl(gasto.google)} />
          <Kv label="LinkedIn Ads" value={brl(gasto.linkedin)} />
        </div>
      </CardContent>
    </Card>
  );
}

function PaidPlatformCard({
  platform,
  data,
  enrichment,
}: {
  platform: AdPlatformSlug;
  data?: PaidPlatformReport;
  enrichment: ReportEnrichment;
}) {
  if (!data) return null;
  const meta = AD_PLATFORMS[platform];
  const result = data.leads != null ? data.leads : data.conversoes;
  const resultLabel = platform === "meta_ads" ? "Leads" : "Conversões";

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-1.5 text-sm">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: meta.color }}
          />
          {meta.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          <Kv label="Investimento" value={brl(data.custo)} />
          <Kv label="Impressões" value={int(data.impressoes)} />
          <Kv label="Cliques" value={int(data.cliques)} />
          <Kv label="CTR" value={pct(data.ctr)} />
          <Kv label="CPC" value={brl(data.cpc)} />
          <Kv label={resultLabel} value={int(result)} />
        </div>

        {data.melhor_campanha && (
          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">
              Melhor campanha
            </p>
            <ReportAdCard
              platform={platform}
              campanha={data.melhor_campanha}
              enriched={
                data.melhor_campanha.ad_id
                  ? enrichment.ads[data.melhor_campanha.ad_id]
                  : undefined
              }
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// --- Viewer -----------------------------------------------------------------

/** Renderiza o report_json conforme o escopo da aba (Seção 6.3). */
export function ReportViewer({
  report,
  enrichment,
  scope,
}: {
  report: MarketingReport;
  enrichment: ReportEnrichment;
  scope: ReportScope;
}) {
  const json = report.report_json;
  if (!json) {
    return (
      <p className="rounded-md border border-dashed py-8 text-center text-sm text-muted-foreground">
        Este relatório não possui dados estruturados.
      </p>
    );
  }

  if (scope === "redes_sociais") {
    const organicTopPosts = (json.top_posts ?? []).filter((p: ReportEntityRef) => {
      const plat = (p.plataforma ?? "").toLowerCase();
      return plat === "instagram" || plat === "facebook" || plat === "linkedin";
    });

    return (
      <div className="space-y-6">
        <ResumoCard resumo={json.resumo} />

        <div className="grid gap-4 lg:grid-cols-3">
          <OrganicNetworkCard
            network="instagram"
            data={json.organico?.instagram}
            enrichment={enrichment}
          />
          <OrganicNetworkCard
            network="facebook"
            data={json.organico?.facebook}
            enrichment={enrichment}
          />
          <OrganicNetworkCard
            network="linkedin"
            data={json.organico?.linkedin}
            enrichment={enrichment}
          />
        </div>

        {organicTopPosts.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Top posts do período</h3>
            <div className="grid gap-3 lg:grid-cols-2">
              {organicTopPosts.map((p: ReportEntityRef, i: number) => (
                <ReportPostCard
                  key={p.id ?? i}
                  entity={p}
                  enriched={p.id ? enrichment.posts[p.id] : undefined}
                />
              ))}
            </div>
          </div>
        )}

        <DestaquesList destaques={json.destaques} />

        <div className="grid gap-4 lg:grid-cols-2">
          <ComparativoCard
            comparativo={json.comparativo_periodo_anterior}
            rows={[
              { label: "Alcance Instagram", key: "instagram_reach_delta_pct" },
              { label: "Engajamento Facebook", key: "facebook_engajamento_delta_pct" },
              { label: "Impressões LinkedIn", key: "linkedin_impressoes_delta_pct" },
            ]}
          />
        </div>

        <AlertasList alertas={json.alertas} />
        <RecomendacoesList recomendacoes={json.recomendacoes} />
      </div>
    );
  }

  // scope: midia_paga_insights
  return (
    <div className="space-y-6">
      <ResumoCard resumo={json.resumo} />

      <div className="grid gap-4 lg:grid-cols-3">
        <GastoTotalCard gasto={json.gasto_total} />
        <ComparativoCard
          comparativo={json.comparativo_periodo_anterior}
          rows={[
            { label: "Gasto Meta Ads", key: "meta_ads_spend_delta_pct" },
            { label: "Custo Google Ads", key: "google_ads_cost_delta_pct" },
          ]}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <PaidPlatformCard
          platform="meta_ads"
          data={json.pago?.meta_ads}
          enrichment={enrichment}
        />
        <PaidPlatformCard
          platform="google_ads"
          data={json.pago?.google_ads}
          enrichment={enrichment}
        />
        <PaidPlatformCard
          platform="linkedin_ads"
          data={json.pago?.linkedin_ads}
          enrichment={enrichment}
        />
      </div>

      <RecomendacoesList recomendacoes={json.recomendacoes} />
      <AlertasList alertas={json.alertas} />
    </div>
  );
}
