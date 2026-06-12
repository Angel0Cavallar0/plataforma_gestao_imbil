import { notFound } from "next/navigation";
import { FacebookMediaDetailShell } from "@/components/marketing/calendar/FacebookMediaDetailShell";
import { resolveInstagramMediaForFacebookPost } from "@/lib/marketing/cross-post-media";
import {
  getFacebookPostInsightHistory,
  getFacebookPostLatest,
} from "@/server/queries/marketing/facebook-insights";

export default async function FacebookPostDetailPage({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const { postId } = await params;
  const decodedId = decodeURIComponent(postId);

  const [latest, history, crossPostPreview] = await Promise.all([
    getFacebookPostLatest(decodedId),
    getFacebookPostInsightHistory(decodedId),
    resolveInstagramMediaForFacebookPost(decodedId),
  ]);

  if (!latest || !history.length) notFound();

  return (
    <FacebookMediaDetailShell
      postId={decodedId}
      latest={latest}
      history={history}
      crossPostPreview={crossPostPreview}
      instagramMediaId={crossPostPreview?.instagramMediaId ?? null}
    />
  );
}
