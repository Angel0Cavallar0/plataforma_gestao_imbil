import { notFound } from "next/navigation";
import { InstagramMediaDetailShell } from "@/components/marketing/calendar/InstagramMediaDetailShell";
import {
  getInstagramCarouselChildren,
  getInstagramMediaInsightHistory,
} from "@/server/queries/marketing/instagram-insights";

export default async function InstagramMediaDetailPage({
  params,
}: {
  params: Promise<{ mediaId: string }>;
}) {
  const { mediaId } = await params;
  const decodedId = decodeURIComponent(mediaId);

  const [history, carouselChildren] = await Promise.all([
    getInstagramMediaInsightHistory(decodedId),
    getInstagramCarouselChildren(decodedId),
  ]);

  if (!history.length) notFound();

  return (
    <InstagramMediaDetailShell
      mediaId={decodedId}
      history={history}
      carouselChildren={carouselChildren}
    />
  );
}
