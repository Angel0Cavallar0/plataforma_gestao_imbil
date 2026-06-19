import Link from "next/link";
import {
  Bookmark,
  ExternalLink,
  Eye,
  Facebook,
  Heart,
  Instagram,
  Linkedin,
  MessageCircle,
  MousePointerClick,
  Play,
  Share2,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PostThumbnail } from "@/components/marketing/insights/shared/PostThumbnail";
import { NETWORKS, friendlyContentType } from "@/lib/constants/marketing-insights";
import { truncate } from "@/lib/marketing/insights";
import { int } from "@/lib/marketing/ad-spend";
import type { CrossPostLookup } from "@/server/queries/marketing/cross-posts";
import type { SocialNetwork, SocialPost } from "@/types/marketing-insights";

const NETWORK_ICON: Record<SocialNetwork, LucideIcon> = {
  instagram: Instagram,
  facebook: Facebook,
  linkedin: Linkedin,
};

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function Metric({ icon: Icon, value }: { icon: LucideIcon; value: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground tabular-nums">
      <Icon className="h-3.5 w-3.5" />
      {int(value)}
    </span>
  );
}

function PostMetrics({ post }: { post: SocialPost }) {
  if (post.network === "instagram") {
    const isVideo = (post.media_type ?? "").toUpperCase().includes("VIDEO");
    return (
      <>
        <Metric icon={Eye} value={post.reach} />
        {isVideo && post.plays > 0 && <Metric icon={Play} value={post.plays} />}
        <Metric icon={Heart} value={post.likes} />
        <Metric icon={MessageCircle} value={post.comments} />
        <Metric icon={Bookmark} value={post.saves} />
        <Metric icon={Share2} value={post.shares} />
      </>
    );
  }
  if (post.network === "facebook") {
    return (
      <>
        <Metric icon={Eye} value={post.reach} />
        <Metric icon={Heart} value={post.reactions} />
        <Metric icon={MessageCircle} value={post.comments} />
        <Metric icon={Share2} value={post.shares} />
        <Metric icon={MousePointerClick} value={post.clicks} />
      </>
    );
  }
  // LinkedIn
  return (
    <>
      <Metric icon={Eye} value={post.impressions} />
      <Metric icon={Heart} value={post.likes} />
      <Metric icon={MessageCircle} value={post.comments} />
      <Metric icon={Share2} value={post.shares} />
    </>
  );
}

function CrossPostBadge({ networks }: { networks: SocialNetwork[] }) {
  if (networks.length === 0) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
      Também em
      {networks.map((n) => {
        const Icon = NETWORK_ICON[n];
        return (
          <Icon
            key={n}
            className="h-3 w-3"
            style={{ color: NETWORKS[n].color }}
            aria-label={NETWORKS[n].name}
          />
        );
      })}
    </span>
  );
}

function ContentPostRow({
  post,
  crossPost,
}: {
  post: SocialPost;
  crossPost: SocialNetwork[];
}) {
  const net = NETWORKS[post.network];
  const NetIcon = NETWORK_ICON[post.network];
  const type = friendlyContentType(
    post.network,
    post.media_type,
    post.media_product_type,
  );
  const detailHref = `/modulos/marketing/calendario-conteudo/${post.network}/${encodeURIComponent(post.id)}`;

  return (
    <div className="flex gap-3 rounded-lg border bg-card p-3">
      <Link href={detailHref} className="shrink-0">
        <PostThumbnail
          network={post.network}
          id={post.id}
          mediaType={post.media_type}
          className="h-20 w-20"
        />
      </Link>

      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="inline-flex items-center gap-1 text-xs font-medium">
            <NetIcon className="h-3.5 w-3.5" style={{ color: net.color }} />
            {net.name}
          </span>
          <Badge variant="outline" className="px-1.5 py-0 text-[10px] font-medium">
            {type}
          </Badge>
          {post.published_at && (
            <span className="text-xs text-muted-foreground">
              · {fmtDate(post.published_at)}
            </span>
          )}
          <CrossPostBadge networks={crossPost} />
        </div>

        {post.caption ? (
          <p className="line-clamp-2 text-xs text-foreground/80">
            {truncate(post.caption, 160)}
          </p>
        ) : (
          <p className="text-xs italic text-muted-foreground">Sem legenda</p>
        )}

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-0.5">
          <PostMetrics post={post} />
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 pt-0.5">
          <Link
            href={detailHref}
            className="text-xs font-medium text-primary hover:underline"
          >
            Ver detalhes
          </Link>
          {post.permalink && (
            <a
              href={post.permalink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              Ver post original <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

/** Lista unificada (linha por post) das três redes, com indicador de cross-post. */
export function ContentPostList({
  posts,
  crossPost,
}: {
  posts: SocialPost[];
  crossPost: CrossPostLookup;
}) {
  if (posts.length === 0) {
    return (
      <p className="rounded-md border border-dashed py-12 text-center text-sm text-muted-foreground">
        Nenhuma postagem publicada neste mês.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {posts.map((p) => (
        <ContentPostRow
          key={`${p.network}:${p.id}`}
          post={p}
          crossPost={crossPost[`${p.network}:${p.id}`] ?? []}
        />
      ))}
    </div>
  );
}
