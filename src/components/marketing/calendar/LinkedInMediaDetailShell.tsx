"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { LinkedInPublishedPreview } from "@/components/marketing/calendar/LinkedInPublishedPreview";
import { LinkedInInsightsPanel } from "@/components/marketing/calendar/LinkedInInsightsPanel";
import { truncateText } from "@/lib/marketing/linkedin-insights";
import type { LinkedInPostInsightRow } from "@/types/marketing";

type Props = {
  latest: LinkedInPostInsightRow;
  history: LinkedInPostInsightRow[];
};

export function LinkedInMediaDetailShell({ latest, history }: Props) {
  const title = truncateText(latest.text, 80);
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
          <span className="rounded-full bg-[#0a66c2] px-2.5 py-0.5 text-xs font-medium text-white">
            Publicado no LinkedIn
          </span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {latest.post_type?.toLowerCase() ?? "publicação"}
          {publishedLabel ? ` · ${publishedLabel}` : ""}
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:items-start">
        <div className="min-w-0 space-y-6">
          <LinkedInPublishedPreview
            postId={latest.post_id}
            text={latest.text}
            isVideo={Boolean(latest.thumbnail_storage_url)}
            hasMedia={Boolean(
              latest.media_storage_url ??
                latest.thumbnail_storage_url ??
                latest.thumbnail_url,
            )}
          />
          {latest.permalink && (
            <a
              href={latest.permalink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
            >
              Ver no LinkedIn
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>

        <LinkedInInsightsPanel fullHistory={history} postType={latest.post_type} />
      </div>
    </div>
  );
}
