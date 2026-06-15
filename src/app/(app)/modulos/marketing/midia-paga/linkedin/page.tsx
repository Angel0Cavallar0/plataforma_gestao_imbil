import { PlatformView } from "@/components/marketing/ad-spend/platform/PlatformView";
import { parseAdSpendFilters } from "@/lib/marketing/ad-spend";

export default async function LinkedInAdsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = parseAdSpendFilters(await searchParams);
  return <PlatformView platformSlug="linkedin_ads" filters={filters} />;
}
