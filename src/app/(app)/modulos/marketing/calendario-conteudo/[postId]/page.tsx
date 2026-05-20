import { notFound } from "next/navigation";
import { PostDetailShell } from "@/components/marketing/calendar/PostDetailShell";
import {
  getActivePlatforms,
  getCampaigns,
  getMetaCredentials,
  getPostById,
} from "@/server/queries/marketing/content";

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
    <PostDetailShell
      post={post}
      platforms={socialPlatforms}
      campaigns={campaigns.map((c) => ({ id: c.id, name: c.name }))}
      credentials={credentials.map((c) => ({
        id: c.id as string,
        label: c.label as string,
        platform_id: c.platform_id as string,
      }))}
    />
  );
}
