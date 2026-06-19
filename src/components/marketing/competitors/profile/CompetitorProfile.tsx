import Link from "next/link";
import { ArrowLeft, ExternalLink, Globe, Camera, Video } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { StarRating } from "../shared/StarRating";
import { EmptyState } from "../shared/EmptyState";
import { YtSubscribersTrend } from "../youtube/YtSubscribersTrend";
import { IgFollowersTrend } from "../social/IgFollowersTrend";
import { YtVideosGrid } from "../youtube/YtVideosGrid";
import { IgPostsGrid } from "../social/IgPostsGrid";
import { ReviewsFeed } from "../reputation/ReviewsFeed";
import { CompetitorNewsFeed } from "../news/CompetitorNewsFeed";
import { CompetitorAdsGrid } from "../ads/CompetitorAdsGrid";
import {
  formatCompact,
  formatDate,
  formatNumber,
  formatRating,
} from "@/lib/marketing/competitors";
import type { CompetitorProfile as Profile } from "@/types/marketing-competitors";

const BASE = "/modulos/marketing/concorrentes";

function Kpi({
  label,
  value,
  sub,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold tabular-nums">{value}</p>
        {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}

/** Perfil consolidado de um concorrente (drill-down) — Seção 5.4. */
export function CompetitorProfile({ profile }: { profile: Profile }) {
  const { competitor: c, overview: o } = profile;
  const competitors = [c];

  return (
    <div className="space-y-6">
      <Link
        href={BASE}
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "w-fit gap-1")}
      >
        <ArrowLeft className="h-4 w-4" /> Voltar à visão geral
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">{c.name}</h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            {c.google_rating != null && (
              <span className="inline-flex items-center gap-1.5">
                <StarRating rating={Number(c.google_rating)} size={13} />
                {formatRating(c.google_rating)}
                <span>({formatNumber(c.google_reviews_count)} reviews)</span>
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            {c.website_url && (
              <a
                href={c.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                <Globe className="h-4 w-4" /> Site <ExternalLink className="h-3 w-3" />
              </a>
            )}
            {c.ig_handle && (
              <a
                href={`https://instagram.com/${c.ig_handle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                <Camera className="h-4 w-4" /> @{c.ig_handle}
              </a>
            )}
            {c.yt_handle && (
              <a
                href={`https://youtube.com/${c.yt_handle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                <Video className="h-4 w-4" /> {c.yt_handle}
              </a>
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Perfil atualizado em {formatDate(c.profile_updated_at)}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          label="Inscritos YouTube"
          value={formatCompact(o?.yt_subscribers)}
          sub={`${formatNumber(o?.yt_videos)} vídeos`}
        />
        <Kpi label="Seguidores Instagram" value={formatCompact(o?.ig_followers)} />
        <Kpi label="Reviews coletadas" value={formatNumber(o?.reviews_collected)} />
        <Kpi label="Anúncios ativos" value={formatNumber(o?.active_ads)} />
      </div>

      <YtSubscribersTrend points={profile.subscribersTrend} />
      <IgFollowersTrend points={profile.followersTrend} />

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Posição em buscas (Google)</h2>
        {profile.keywordRankings.length ? (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">Data</th>
                  <th className="px-4 py-2 text-left font-medium">Palavra-chave</th>
                  <th className="px-4 py-2 text-right font-medium">Posição</th>
                </tr>
              </thead>
              <tbody>
                {profile.keywordRankings.map((r, i) => (
                  <tr
                    key={`${r.keyword}-${r.data_referencia}-${i}`}
                    className="border-b last:border-0"
                  >
                    <td className="px-4 py-2">{formatDate(r.data_referencia)}</td>
                    <td className="px-4 py-2">{r.keyword}</td>
                    <td className="px-4 py-2 text-right tabular-nums">
                      {r.position ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState message="Sem dados de ranking de busca." />
        )}
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Vídeos recentes</h2>
        <YtVideosGrid videos={profile.recentVideos} competitors={competitors} />
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Posts recentes</h2>
        <IgPostsGrid posts={profile.recentPosts} competitors={competitors} />
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Anúncios</h2>
        <CompetitorAdsGrid ads={profile.ads} competitors={competitors} />
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Notícias</h2>
        <CompetitorNewsFeed news={profile.news} competitors={competitors} />
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Avaliações</h2>
        <ReviewsFeed reviews={profile.reviews} competitors={competitors} />
      </div>
    </div>
  );
}
