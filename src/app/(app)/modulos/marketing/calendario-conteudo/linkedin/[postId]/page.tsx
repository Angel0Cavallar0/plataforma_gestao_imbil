import { notFound } from "next/navigation";
import { LinkedInMediaDetailShell } from "@/components/marketing/calendar/LinkedInMediaDetailShell";
import {
  getLinkedInPostInsightHistory,
  getLinkedInPostLatest,
} from "@/server/queries/marketing/linkedin-insights";

export default async function LinkedInPostDetailPage({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const { postId } = await params;
  const decodedId = decodeURIComponent(postId);

  const [latest, history] = await Promise.all([
    getLinkedInPostLatest(decodedId),
    getLinkedInPostInsightHistory(decodedId),
  ]);

  if (!latest || !history.length) notFound();

  return <LinkedInMediaDetailShell latest={latest} history={history} />;
}
