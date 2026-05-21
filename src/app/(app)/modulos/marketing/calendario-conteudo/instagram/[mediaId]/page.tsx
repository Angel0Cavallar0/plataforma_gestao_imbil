import { notFound } from "next/navigation";
import { InstagramMediaDetailShell } from "@/components/marketing/calendar/InstagramMediaDetailShell";
import {
  getInstagramCarouselChildren,
  getInstagramMediaInsightHistory,
  getInstagramMediaLatest,
} from "@/server/queries/marketing/instagram-insights";

export default async function InstagramMediaDetailPage({
  params,
}: {
  params: Promise<{ mediaId: string }>;
}) {
  const { mediaId } = await params;
  const decodedId = decodeURIComponent(mediaId);

  const [latest, history, carouselChildren] = await Promise.all([
    getInstagramMediaLatest(decodedId),
    getInstagramMediaInsightHistory(decodedId),
    getInstagramCarouselChildren(decodedId),
  ]);

  if (!latest || !history.length) notFound();

  return (
    <InstagramMediaDetailShell
      mediaId={decodedId}
      latest={latest}
      history={history}
      carouselChildren={carouselChildren}
    />
  );
}
