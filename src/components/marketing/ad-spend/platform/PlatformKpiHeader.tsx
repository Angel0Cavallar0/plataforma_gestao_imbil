import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricInfo } from "@/components/marketing/ad-spend/shared/MetricInfo";

export type StatTile = {
  label: string;
  value: string;
  hint?: string;
  /** tooltip opcional no rótulo. */
  title?: string;
  /** texto do ícone "?" ao lado do rótulo. */
  info?: string;
};

/** Cabeçalho de KPIs da visão por plataforma — grade de tiles. */
export function PlatformKpiHeader({ tiles }: { tiles: StatTile[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {tiles.map((tile) => (
        <Card key={tile.label}>
          <CardHeader className="pb-2">
            <CardTitle
              className="flex items-center text-sm font-medium text-muted-foreground"
              title={tile.title}
            >
              {tile.label}
              {tile.info && <MetricInfo text={tile.info} />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{tile.value}</p>
            {tile.hint && <p className="text-xs text-muted-foreground">{tile.hint}</p>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
