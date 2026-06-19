"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { FacebookPublishedPreview } from "@/components/marketing/calendar/FacebookPublishedPreview";
import { FacebookCommentsPanel } from "@/components/marketing/calendar/FacebookCommentsPanel";
import { FacebookInsightsPanel } from "@/components/marketing/calendar/FacebookInsightsPanel";
import { InstagramPublishedPreview } from "@/components/marketing/calendar/InstagramPublishedPreview";
import { hasBoostedHistory, truncateMessage } from "@/lib/marketing/facebook-insights";
import type { CrossPostInstagramPreview } from "@/lib/marketing/cross-post-media";
import type { FacebookPostInsightRow } from "@/types/marketing";

type Props = {
  postId: string;
  latest: FacebookPostInsightRow;
  history: FacebookPostInsightRow[];
  crossPostPreview: CrossPostInstagramPreview | null;
  instagramMediaId: string | null;
};

export function FacebookMediaDetailShell({
  postId,
  latest,
  history,
  crossPostPreview,
  instagramMediaId,
}: Props) {
  const title = truncateMessage(latest.message, 80);
  const publishedLabel = latest.published_at
    ? new Date(latest.published_at).toLocaleString("pt-BR")
    : null;
  const hasPaidMedia = hasBoostedHistory(history);

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
          <span className="rounded-full bg-[#1e40af] px-2.5 py-0.5 text-xs font-medium text-white">
            Publicado no Facebook
          </span>
          {hasPaidMedia && (
            <span className="rounded-full bg-amber-600 px-2.5 py-0.5 text-xs font-medium text-white">
              Mídia paga
            </span>
          )}
          {instagramMediaId && (
            <Link
              href={`/modulos/marketing/calendario-conteudo/instagram/${encodeURIComponent(instagramMediaId)}`}
              className="rounded-full border border-emerald-800 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-900 hover:bg-emerald-100"
            >
              Também no Instagram →
            </Link>
          )}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {latest.post_type ?? "publicação"}
          {publishedLabel ? ` · ${publishedLabel}` : ""}
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:items-start">
        <div className="min-w-0 space-y-6">
          {latest.media_storage_url ? (
            <FacebookPublishedPreview
              postId={postId}
              message={latest.message}
              isVideo={Boolean(latest.thumbnail_storage_url)}
              hasMedia
            />
          ) : crossPostPreview ? (
            <InstagramPublishedPreview
              mediaId={crossPostPreview.instagramMediaId}
              latest={crossPostPreview.latest}
              carouselItems={crossPostPreview.carouselChildren}
              captionOverride={latest.message}
              mediaSubLabel="Mídia do Instagram · texto do Facebook"
            />
          ) : (
            <FacebookPublishedPreview postId={postId} message={latest.message} />
          )}
          {latest.permalink && (
            <a
              href={latest.permalink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
            >
              Ver no Facebook
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
          <FacebookCommentsPanel key={postId} postId={postId} />
        </div>

        <FacebookInsightsPanel fullHistory={history} postType={latest.post_type} />
      </div>
    </div>
  );
}
