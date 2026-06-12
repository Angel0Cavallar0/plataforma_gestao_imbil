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
  if (!link) return null;

  const [latest, carouselChildren] = await Promise.all([
    getInstagramMediaLatest(link.instagram_media_id),
    getInstagramCarouselChildren(link.instagram_media_id),
  ]);

  if (!latest) return null;

  return {
    instagramMediaId: link.instagram_media_id,
    latest,
    carouselChildren,
  };
}
