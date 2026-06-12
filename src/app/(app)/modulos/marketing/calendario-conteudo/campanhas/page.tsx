import Link from "next/link";
import { getCampaigns } from "@/server/queries/marketing/content";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function CampanhasPage() {
  const campaigns = await getCampaigns();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/modulos/marketing/calendario-conteudo"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Calendário
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Campanhas de conteúdo</h1>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {campaigns.map((c) => (
          <Card key={c.id}>
            <CardHeader>
              <CardTitle className="text-base">{c.name}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {c.description ?? "Sem descrição"}
            </CardContent>
          </Card>
        ))}
      </div>
      {!campaigns.length && (
        <p className="text-muted-foreground">Nenhuma campanha cadastrada.</p>
      )}
    </div>
  );
}
