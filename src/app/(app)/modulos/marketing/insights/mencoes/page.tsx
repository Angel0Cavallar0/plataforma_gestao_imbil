import { SentimentDistribution } from "@/components/marketing/insights/mentions/SentimentDistribution";
import { MentionsFeed } from "@/components/marketing/insights/mentions/MentionsFeed";
import { getBrandMentions } from "@/server/queries/marketing/insights";

export default async function MencoesInsightsPage() {
  const data = await getBrandMentions();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Insights — Menções à Marca</h1>
        <p className="text-sm text-muted-foreground">
          Menções à Imbil e avaliações do Google Meu Negócio.
        </p>
      </div>

      <SentimentDistribution data={data} />
      <MentionsFeed data={data} />
    </div>
  );
}
