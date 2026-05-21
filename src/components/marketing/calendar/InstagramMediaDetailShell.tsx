"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { InstagramMediaPreview } from "@/components/marketing/calendar/InstagramMediaPreview";
import { InstagramCommentsPanel } from "@/components/marketing/calendar/InstagramCommentsPanel";
import { InstagramInsightsPanel } from "@/components/marketing/calendar/InstagramInsightsPanel";
import { truncateCaption } from "@/lib/marketing/instagram-insights";
import type { InstagramCarouselChild, InstagramMediaInsightRow } from "@/types/marketing";

type Props = {
  mediaId: string;
  history: InstagramMediaInsightRow[];
  carouselChildren: InstagramCarouselChild[];
};

export function InstagramMediaDetailShell({ mediaId, history, carouselChildren }: Props) {
  const latest = history[history.length - 1];
  if (!latest) return null;

  const title = truncateCaption(latest.caption, 80);
  const publishedLabel = latest.published_at
    ? new Date(latest.published_at).toLocaleString("pt-BR")
    : null;

  return (
    <div className="w-full max-w-none space-y-6">
      <div>
        <Link
          href="/modulos/marketing/calendario-conteudo"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Voltar ao calendário
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold">{title}</h1>
          <span className="rounded-full bg-emerald-800 px-2.5 py-0.5 text-xs font-medium text-white">
            Publicado no Instagram
          </span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {latest.media_type}
          {latest.media_product_type ? ` · ${latest.media_product_type}` : ""}
          {publishedLabel ? ` · ${publishedLabel}` : ""}
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:items-start">
        <div className="min-w-0 space-y-6">
          <InstagramMediaPreview latest={latest} carouselItems={carouselChildren} />
          {latest.caption && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Legenda</h3>
              <p className="whitespace-pre-wrap text-sm">{latest.caption}</p>
            </div>
          )}
          {latest.permalink && (
            <a
              href={latest.permalink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
            >
              Ver no Instagram
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
          <InstagramCommentsPanel key={mediaId} mediaId={mediaId} />
        </div>

        <InstagramInsightsPanel fullHistory={history} />
      </div>
    </div>
  );
}
