import { getCrossPostLinkByFacebookPostId } from "@/server/queries/marketing/facebook-insights";
import {
  getInstagramCarouselChildren,
  getInstagramMediaLatest,
} from "@/server/queries/marketing/instagram-insights";
import type { InstagramCarouselChild, InstagramMediaInsightRow } from "@/types/marketing";

export type CrossPostInstagramPreview = {
  instagramMediaId: string;
  latest: InstagramMediaInsightRow;
  carouselChildren: InstagramCarouselChild[];
};

export async function resolveInstagramMediaForFacebookPost(
  facebookPostId: string,
): Promise<CrossPostInstagramPreview | null> {
  const link = await getCrossPostLinkByFacebookPostId(facebookPostId);
  if (!link?.instagram_media_id) return null;

  const igMediaId = link.instagram_media_id;
  const [latest, carouselChildren] = await Promise.all([
    getInstagramMediaLatest(igMediaId),
    getInstagramCarouselChildren(igMediaId),
  ]);

  if (!latest) return null;

  return {
    instagramMediaId: igMediaId,
    latest,
    carouselChildren,
  };
}
