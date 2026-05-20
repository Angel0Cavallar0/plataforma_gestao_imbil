import Link from "next/link";
import { notFound } from "next/navigation";
import { PostForm } from "@/components/marketing/calendar/PostForm";
import { PostStatusBadge } from "@/components/marketing/calendar/PostStatusBadge";
import { PostDetailActions } from "@/components/marketing/calendar/PostDetailActions";
import {
  getActivePlatforms,
  getCampaigns,
  getMetaCredentials,
  getPostById,
} from "@/server/queries/marketing/content";
import { CONTENT_TYPE_LABELS } from "@/lib/constants/marketing";

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const { postId } = await params;
  const [post, platforms, campaigns, credentials] = await Promise.all([
    getPostById(postId),
    getActivePlatforms(),
    getCampaigns(),
    getMetaCredentials(),
  ]);

  if (!post) notFound();

  const socialPlatforms = platforms.filter((p) =>
    ["instagram", "facebook"].includes(p.slug),
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/modulos/marketing/calendario-conteudo"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Calendário
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold">{post.title}</h1>
          <PostStatusBadge status={post.status} />
        </div>
        <p className="text-sm text-muted-foreground">
          {post.platform.name} · {CONTENT_TYPE_LABELS[post.content_type]} ·{" "}
          {new Date(post.scheduled_at).toLocaleString("pt-BR")}
        </p>
      </div>

      <PostDetailActions post={post} />

      <PostForm
        post={post}
        platforms={socialPlatforms}
        campaigns={campaigns.map((c) => ({ id: c.id, name: c.name }))}
        credentials={credentials.map((c) => ({
          id: c.id as string,
          label: c.label as string,
          platform_id: c.platform_id as string,
        }))}
      />
    </div>
  );
}
