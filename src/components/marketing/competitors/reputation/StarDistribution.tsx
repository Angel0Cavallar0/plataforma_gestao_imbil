import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "../shared/EmptyState";
import { StarRating } from "../shared/StarRating";
import type { CompetitorReview } from "@/types/marketing-competitors";

/** Distribuição de estrelas das reviews carregadas (Seção 11). */
export function StarDistribution({ reviews }: { reviews: CompetitorReview[] }) {
  const counts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));
  const total = reviews.filter((r) => r.rating != null).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Distribuição de estrelas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {total === 0 ? (
          <EmptyState message="Sem avaliações com nota." />
        ) : (
          counts.map(({ star, count }) => {
            const pct = (count / total) * 100;
            return (
              <div key={star} className="flex items-center gap-3">
                <span className="w-20 shrink-0">
                  <StarRating rating={star} size={12} />
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-amber-400"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-8 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                  {count}
                </span>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
