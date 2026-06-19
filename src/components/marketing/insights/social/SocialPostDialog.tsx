"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Loader2, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PostThumbnail } from "@/components/marketing/insights/shared/PostThumbnail";
import { InstagramCommentsPanel } from "@/components/marketing/calendar/InstagramCommentsPanel";
import { NETWORKS } from "@/lib/constants/marketing-insights";
import { brl, int } from "@/lib/marketing/ad-spend";
import { getSocialPostDetailAction } from "@/server/actions/marketing/social-posts";
import type { SocialPost } from "@/types/marketing-insights";

/** Rótulos pt-BR das colunas de métricas (IG + FB). */
const FIELD_LABELS: Record<string, string> = {
  impressions: "Impressões",
  reach: "Alcance",
  likes: "Curtidas",
  comments: "Comentários",
  saves: "Salvamentos",
  shares: "Compartilhamentos",
  plays: "Plays",
  replies: "Respostas",
  exits: "Saídas",
  taps_forward: "Toques (avançar)",
  taps_back: "Toques (voltar)",
  navigation: "Navegação",
  profile_visits: "Visitas ao perfil",
  profile_activity: "Ações no perfil",
  engaged_users: "Usuários engajados",
  reactions_total: "Reações (total)",
  reactions_like: "Curtir",
  reactions_love: "Amei",
  reactions_haha: "Haha",
  reactions_wow: "Uau",
  reactions_sad: "Triste",
  reactions_angry: "Grr",
  clicks: "Cliques",
  video_views: "Visualizações de vídeo",
  video_views_organic: "Views vídeo (orgânico)",
  video_views_paid: "Views vídeo (pago)",
  video_complete_views: "Visualizações completas",
  video_avg_watch_time: "Tempo médio assistido",
  is_boosted: "Impulsionado",
  ad_spend: "Investimento",
  ad_impressions: "Impressões pagas",
  ad_reach: "Alcance pago",
};

/** Colunas exibidas fora da grade de métricas (cabeçalho) ou internas. */
const HIDDEN_FIELDS = new Set([
  "media_id",
  "post_id",
  "data_referencia",
  "published_at",
  "permalink",
  "media_url",
  "thumbnail_url",
  "caption",
  "message",
  "media_type",
  "post_type",
  "media_product_type",
  "instagram_media_id",
  "coletado_em",
]);

function formatValue(key: string, val: unknown): string {
  if (typeof val === "boolean") return val ? "Sim" : "Não";
  const num =
    typeof val === "number"
      ? val
      : typeof val === "string" && val.trim() !== "" && !Number.isNaN(Number(val))
        ? Number(val)
        : null;
  if (key.includes("spend")) return brl(num);
  if (num !== null) return key.includes("watch_time") ? `${num}s` : int(num);
  return String(val);
}

function label(key: string): string {
  return FIELD_LABELS[key] ?? key.replace(/_/g, " ");
}

function fmtDateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Pop-up com todos os dados de um post (e comentários, no caso do Instagram). */
export function SocialPostDialog({
  post,
  open,
  onOpenChange,
}: {
  post: SocialPost;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const net = NETWORKS[post.network];

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void getSocialPostDetailAction(post.network, post.id).then((res) => {
      if (cancelled) return;
      setError(res.error ?? null);
      setDetail(res.data ?? null);
      setLoadedId(post.id);
    });
    return () => {
      cancelled = true;
    };
  }, [open, post.network, post.id]);

  const loading = open && loadedId !== post.id;

  const entries = detail
    ? Object.entries(detail).filter(
        ([k, v]) => !HIDDEN_FIELDS.has(k) && v != null && typeof v !== "object",
      )
    : [];

  const mediaType = (detail?.media_type as string) ?? post.media_type;
  const publishedAt = (detail?.published_at as string) ?? post.published_at;
  const caption =
    (detail?.caption as string) ?? (detail?.message as string) ?? post.caption;
  const permalink = (detail?.permalink as string) ?? post.permalink;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: net.color }}
            />
            {net.name}
            {mediaType && (
              <span className="text-sm font-normal uppercase text-muted-foreground">
                {mediaType}
              </span>
            )}
            {post.is_boosted && (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
                <Sparkles className="h-3 w-3" /> Impulsionado
              </span>
            )}
          </DialogTitle>
          <DialogDescription>Publicado em {fmtDateTime(publishedAt)}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-4">
            <PostThumbnail
              network={post.network}
              id={post.id}
              mediaType={mediaType}
              className="h-32 w-32"
            />
            <div className="min-w-0 flex-1 space-y-2">
              {caption && (
                <p className="max-h-32 overflow-y-auto whitespace-pre-wrap text-sm text-foreground/90">
                  {caption}
                </p>
              )}
              {permalink && (
                <a
                  href={permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                >
                  Abrir publicação <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold">Métricas</h3>
            {loading && (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Carregando dados…
              </p>
            )}
            {error && !loading && <p className="text-sm text-destructive">{error}</p>}
            {!loading && entries.length > 0 && (
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
                {entries.map(([k, v]) => (
                  <div key={k} className="flex flex-col">
                    <dt className="text-xs text-muted-foreground">{label(k)}</dt>
                    <dd className="text-sm font-medium tabular-nums">
                      {formatValue(k, v)}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
            {!loading && !error && entries.length === 0 && (
              <p className="text-sm text-muted-foreground">Sem métricas disponíveis.</p>
            )}
          </div>

          {post.network === "instagram" && (
            <div className="border-t pt-4">
              <InstagramCommentsPanel mediaId={post.id} />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
