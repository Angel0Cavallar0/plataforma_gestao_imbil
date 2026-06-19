import { ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "../shared/EmptyState";
import { formatDate } from "@/lib/marketing/competitors";
import type { Competitor, CompetitorNews } from "@/types/marketing-competitors";

/** Feed de notícias por concorrente (Seção 10). */
export function CompetitorNewsFeed({
  news,
  competitors,
}: {
  news: CompetitorNews[];
  competitors: Competitor[];
}) {
  if (!news.length) {
    return <EmptyState message="Nenhuma notícia coletada para esta seleção." />;
  }
  const nameById = new Map(competitors.map((c) => [c.id, c.name]));

  return (
    <div className="space-y-3">
      {news.map((n) => (
        <Card key={n.id} className="flex gap-4 p-4">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{n.source_name ?? "—"}</span>
              <span>•</span>
              <span>{formatDate(n.published_at)}</span>
              <span>•</span>
              <span className="font-medium text-foreground">
                {nameById.get(n.competitor_id) ?? "—"}
              </span>
            </div>
            <a
              href={n.article_url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium hover:underline"
            >
              {n.title ?? n.article_url}
            </a>
            {n.description && (
              <p className="line-clamp-2 text-sm text-muted-foreground">
                {n.description}
              </p>
            )}
            <a
              href={n.article_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              Ler matéria <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </Card>
      ))}
    </div>
  );
}
