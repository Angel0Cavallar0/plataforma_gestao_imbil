import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ContentKpis } from "@/types/marketing";

export function ContentKpiCards({ kpis }: { kpis: ContentKpis }) {
  const items = [
    { label: "Agendados (7 dias)", value: kpis.scheduledNext7d },
    { label: "Publicados (30 dias)", value: kpis.publishedLast30d },
    { label: "Rascunhos", value: kpis.drafts },
    { label: "Falhas não resolvidas", value: kpis.failedUnresolved },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {item.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{item.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
