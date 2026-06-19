import { ExternalLink, User } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "../shared/EmptyState";
import { StarRating } from "../shared/StarRating";
import { formatDate } from "@/lib/marketing/competitors";
import type { Competitor, CompetitorReview } from "@/types/marketing-competitors";

/** Feed de reviews por concorrente (Seção 11). */
export function ReviewsFeed({
  reviews,
  competitors,
}: {
  reviews: CompetitorReview[];
  competitors: Competitor[];
}) {
  if (!reviews.length) {
    return <EmptyState message="Nenhuma avaliação encontrada para esta seleção." />;
  }
  const nameById = new Map(competitors.map((c) => [c.id, c.name]));

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {reviews.map((r) => (
        <Card key={r.id} className="flex flex-col gap-2 p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <User className="h-4 w-4" />
              </span>
              <div className="leading-tight">
                <p className="text-sm font-medium">{r.autor_nome ?? "Anônimo"}</p>
                <p className="text-xs text-muted-foreground">
                  {nameById.get(r.competitor_id) ?? "—"}
                </p>
              </div>
            </div>
            <StarRating rating={r.rating} />
          </div>
          {r.texto && (
            <p className="line-clamp-4 text-sm text-muted-foreground">{r.texto}</p>
          )}
          <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground">
            <span>{formatDate(r.data_publicacao)}</span>
            {r.url && (
              <a
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                Ver no Google <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
