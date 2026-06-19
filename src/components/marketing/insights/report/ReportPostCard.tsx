import { ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PostThumbnail } from "@/components/marketing/insights/shared/PostThumbnail";
import { BoostedBadge } from "@/components/marketing/insights/social/BoostedBadge";
import {
  ReportEntityKpis,
  type Kpi,
} from "@/components/marketing/insights/report/ReportEntityKpis";
import { NETWORKS } from "@/lib/constants/marketing-insights";
import { int } from "@/lib/marketing/ad-spend";
import { truncate } from "@/lib/marketing/insights";
import type {
  EnrichedPost,
  ReportEntityRef,
  SocialNetwork,
} from "@/types/marketing-insights";

function resolveNetwork(entity: ReportEntityRef): SocialNetwork {
  const p = (entity.plataforma ?? "").toLowerCase();
  if (p === "facebook") return "facebook";
  if (p === "linkedin") return "linkedin";
  return "instagram";
}

function buildKpis(
  network: SocialNetwork,
  entity: ReportEntityRef,
  enriched?: EnrichedPost,
): Kpi[] {
  if (!enriched) {
    // Fallback: usa o que o próprio report_json carrega (Seção 6-B.6).
    const kpis: Kpi[] = [];
    if (entity.reach != null)
      kpis.push({ label: "Alcance", value: int(entity.reach), primary: true });
    if (entity.engajamento != null)
      kpis.push({ label: "Engajamento", value: int(entity.engajamento) });
    return kpis;
  }

  if (network === "facebook") {
    return [
      { label: "Alcance", value: int(enriched.reach), primary: true },
      { label: "Reações", value: int(enriched.reactions) },
      { label: "Coment.", value: int(enriched.comments) },
      { label: "Compart.", value: int(enriched.shares) },
      { label: "Cliques", value: int(enriched.clicks) },
    ];
  }

  const type = (enriched.media_type ?? entity.tipo ?? "").toUpperCase();
  if (type.includes("VIDEO") || type.includes("REEL")) {
    return [
      { label: "Alcance", value: int(enriched.reach), primary: true },
      { label: "Plays", value: int(enriched.plays) },
      { label: "Curtidas", value: int(enriched.likes) },
      { label: "Coment.", value: int(enriched.comments) },
      { label: "Salv.", value: int(enriched.saves) },
    ];
  }
  if (type.includes("CAROUSEL") || type.includes("ALBUM")) {
    return [
      { label: "Alcance", value: int(enriched.reach), primary: true },
      { label: "Curtidas", value: int(enriched.likes) },
      { label: "Coment.", value: int(enriched.comments) },
      { label: "Salv.", value: int(enriched.saves) },
    ];
  }
  return [
    { label: "Alcance", value: int(enriched.reach), primary: true },
    { label: "Curtidas", value: int(enriched.likes) },
    { label: "Coment.", value: int(enriched.comments) },
    { label: "Salv.", value: int(enriched.saves) },
    { label: "Compart.", value: int(enriched.shares) },
  ];
}

/** Card de post orgânico do relatório, enriquecido (Seção 6-B.5). */
export function ReportPostCard({
  entity,
  enriched,
}: {
  entity: ReportEntityRef;
  enriched?: EnrichedPost;
}) {
  const network = resolveNetwork(entity);
  const meta = NETWORKS[network];
  const id = enriched?.id ?? entity.id ?? "";
  const caption = enriched?.caption ?? entity.caption_preview ?? null;
  const link = enriched?.permalink ?? entity.link ?? null;
  const mediaType = enriched?.media_type ?? entity.tipo ?? null;
  const isBoosted = enriched?.is_boosted ?? entity.is_boosted ?? false;

  return (
    <Card>
      <CardContent className="flex gap-3 p-3">
        <PostThumbnail
          network={network}
          id={id}
          mediaType={mediaType}
          className="h-20 w-20"
        />
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="inline-flex items-center gap-1 text-xs font-medium">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: meta.color }}
              />
              {meta.name}
            </span>
            {mediaType && (
              <span className="text-xs uppercase text-muted-foreground">{mediaType}</span>
            )}
            {isBoosted && (
              <BoostedBadge
                spend={enriched?.ad_spend ?? null}
                impressions={null}
                reach={null}
              />
            )}
          </div>

          {caption ? (
            <p className="line-clamp-2 text-xs text-foreground/80">
              {truncate(caption, 140)}
            </p>
          ) : (
            <p className="text-xs italic text-muted-foreground">Post no {meta.name}</p>
          )}

          <ReportEntityKpis items={buildKpis(network, entity, enriched)} />

          {link && (
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              Ver post <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
