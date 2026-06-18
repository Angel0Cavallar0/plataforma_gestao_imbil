import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { int } from "@/lib/marketing/ad-spend";

type DemoResult = { value?: number; dimension_values?: string[] };
type DemoBreakdown = { dimension_keys?: string[]; results?: DemoResult[] };

const DIM_LABELS: Record<string, string> = {
  country: "País",
  city: "Cidade",
  age: "Faixa etária",
  gender: "Gênero",
  locale: "Idioma",
};

const GENDER_LABELS: Record<string, string> = {
  M: "Masculino",
  F: "Feminino",
  U: "Não informado",
};

let regionNames: Intl.DisplayNames | null = null;
function regionName(code: string): string {
  try {
    regionNames ??= new Intl.DisplayNames(["pt-BR"], { type: "region" });
    return regionNames.of(code) ?? code;
  } catch {
    return code;
  }
}

function valueLabel(dimKey: string, raw: string): string {
  if (dimKey === "country") return regionName(raw);
  if (dimKey === "gender") return GENDER_LABELS[raw] ?? raw;
  return raw;
}

/** Demografia de seguidores do Instagram (Seção 3.3). */
export function DemographicsPanel({ demographics }: { demographics: unknown }) {
  const breakdowns = (demographics as { breakdowns?: DemoBreakdown[] } | null)
    ?.breakdowns;
  if (!Array.isArray(breakdowns) || breakdowns.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Demografia dos seguidores</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6 sm:grid-cols-2">
        {breakdowns.map((b, i) => {
          const dimKey = b.dimension_keys?.[0] ?? "";
          const title = DIM_LABELS[dimKey] ?? dimKey ?? "Distribuição";
          const rows = (b.results ?? [])
            .map((r) => ({
              label: (r.dimension_values ?? [])
                .map((v) => valueLabel(dimKey, v))
                .join(" · "),
              value: r.value ?? 0,
            }))
            .sort((a, b2) => b2.value - a.value)
            .slice(0, 8);
          const max = Math.max(1, ...rows.map((r) => r.value));

          return (
            <div key={i} className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">{title}</p>
              <ul className="space-y-1.5">
                {rows.map((r) => (
                  <li key={r.label} className="space-y-0.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="truncate">{r.label}</span>
                      <span className="ml-2 tabular-nums text-muted-foreground">
                        {int(r.value)}
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${(r.value / max) * 100}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
