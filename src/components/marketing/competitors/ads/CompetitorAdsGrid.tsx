import { ExternalLink, Megaphone } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "../shared/EmptyState";
import { formatDate } from "@/lib/marketing/competitors";
import type { Competitor, CompetitorAd } from "@/types/marketing-competitors";

/** Cards de anúncios da Meta Ad Library (Seção 9). Estado vazio é o cenário comum. */
export function CompetitorAdsGrid({
  ads,
  competitors,
}: {
  ads: CompetitorAd[];
  competitors: Competitor[];
}) {
  if (!ads.length) {
    return (
      <EmptyState
        icon={<Megaphone className="h-6 w-6" />}
        message="Nenhum anúncio ativo encontrado. Os concorrentes da Imbil raramente veiculam anúncios na Meta Ad Library."
      />
    );
  }
  const nameById = new Map(competitors.map((c) => [c.id, c.name]));

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {ads.map((ad) => (
        <Card key={ad.id} className="flex flex-col gap-3 p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium">
              {nameById.get(ad.competitor_id) ?? ad.page_name ?? "—"}
            </span>
            <Badge variant={ad.status === "ACTIVE" ? "success" : "muted"}>
              {ad.status === "ACTIVE" ? "Ativo" : (ad.status ?? "—")}
            </Badge>
          </div>
          <p className="line-clamp-5 flex-1 text-sm text-muted-foreground">
            {ad.ad_creative_body?.trim() || "Sem texto de criativo."}
          </p>
          {ad.platforms?.length ? (
            <div className="flex flex-wrap gap-1">
              {ad.platforms.map((p) => (
                <Badge key={p} variant="outline" className="capitalize">
                  {p.toLowerCase()}
                </Badge>
              ))}
            </div>
          ) : null}
          <div className="text-xs text-muted-foreground">
            Veiculação: {formatDate(ad.ad_delivery_start_time)} →{" "}
            {ad.ad_delivery_stop_time ? formatDate(ad.ad_delivery_stop_time) : "em curso"}
          </div>
          {ad.ad_snapshot_url && (
            <a
              href={ad.ad_snapshot_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              Ver na Ad Library <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </Card>
      ))}
    </div>
  );
}
