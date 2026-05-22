import { getPostsForCalendar } from "@/server/queries/marketing/content";
import { getFacebookPostsForCalendar } from "@/server/queries/marketing/facebook-insights";
import { getInstagramMediaForCalendar } from "@/server/queries/marketing/instagram-insights";
import type { CalendarPostEvent } from "@/types/marketing";

export async function getCalendarEvents(filters?: {
  from?: string;
  to?: string;
  platformId?: string;
  status?: string;
  campaignId?: string;
  assignedTo?: string;
}): Promise<CalendarPostEvent[]> {
  const [posts, instagramMedia, facebookPosts] = await Promise.all([
    getPostsForCalendar(filters),
    getInstagramMediaForCalendar({ from: filters?.from, to: filters?.to }),
    getFacebookPostsForCalendar({ from: filters?.from, to: filters?.to }),
  ]);

  const syncedExternalIds = new Set([
    ...instagramMedia.map((e) => e.id),
    ...facebookPosts.map((e) => e.id),
  ]);

  const contentEvents = posts.filter((p) => {
    if (p.status !== "publicado" || !p.externalPostId) return true;
    return !syncedExternalIds.has(p.externalPostId);
  });

  return [...contentEvents, ...instagramMedia, ...facebookPosts];
}
