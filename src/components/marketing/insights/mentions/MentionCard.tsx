import { ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { StarRating } from "@/components/marketing/insights/mentions/StarRating";
import {
  mentionPlatformColor,
  mentionPlatformLabel,
} from "@/lib/constants/marketing-insights";
import type { BrandMention } from "@/types/marketing-insights";

function initials(name: string | null): string {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function fmtDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/** Card de uma menção à marca (Seção 5.3). Avatar via iniciais (CSP-safe). */
export function MentionCard({ mention }: { mention: BrandMention }) {
  const color = mentionPlatformColor(mention.plataforma);

  return (
    <Card>
      <CardContent className="space-y-2 p-4">
        <div className="flex items-start gap-3">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
            style={{ backgroundColor: color }}
          >
            {initials(mention.autor_nome)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2">
              <span className="truncate text-sm font-medium">
                {mention.autor_nome ?? "Autor desconhecido"}
              </span>
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
                style={{ backgroundColor: color }}
              >
                {mentionPlatformLabel(mention.plataforma)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {fmtDate(mention.data_publicacao)}
            </p>
          </div>
        </div>

        {mention.rating != null && <StarRating rating={mention.rating} />}

        {mention.texto && (
          <p className="whitespace-pre-line text-sm text-foreground/90">
            {mention.texto}
          </p>
        )}

        {mention.url && (
          <a
            href={mention.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            Ver original <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </CardContent>
    </Card>
  );
}
