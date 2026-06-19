import { notFound } from "next/navigation";
import { CompetitorProfile } from "@/components/marketing/competitors/profile/CompetitorProfile";
import { getCompetitorProfile } from "@/server/queries/marketing/competitors";

export default async function CompetitorProfilePage({
  params,
}: {
  params: Promise<{ competitorId: string }>;
}) {
  const { competitorId } = await params;
  const profile = await getCompetitorProfile(competitorId);
  if (!profile) notFound();

  return <CompetitorProfile profile={profile} />;
}
