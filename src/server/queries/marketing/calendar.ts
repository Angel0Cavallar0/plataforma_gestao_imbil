import { getPostsForCalendar } from "@/server/queries/marketing/content";
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
  const [posts, instagramMedia] = await Promise.all([
    getPostsForCalendar(filters),
    getInstagramMediaForCalendar({ from: filters?.from, to: filters?.to }),
  ]);

  const igMediaIds = new Set(instagramMedia.map((e) => e.id));

  const contentEvents = posts.filter((p) => {
    if (p.status !== "publicado" || !p.externalPostId) return true;
    return !igMediaIds.has(p.externalPostId);
  });

  return [...contentEvents, ...instagramMedia];
}
