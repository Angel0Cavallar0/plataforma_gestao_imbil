import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Video, Camera, Star } from "lucide-react";
import { formatCompact, formatRating } from "@/lib/marketing/competitors";
import type { CompetitorOverview } from "@/types/marketing-competitors";

function maxBy(
  rows: CompetitorOverview[],
  pick: (r: CompetitorOverview) => number | null,
): CompetitorOverview | null {
  let best: CompetitorOverview | null = null;
  let bestVal = -Infinity;
  for (const r of rows) {
    const v = pick(r);
    if (v != null && v > bestVal) {
      bestVal = v;
      best = r;
    }
  }
  return best;
}

function Kpi({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
          {icon}
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold tabular-nums">{value}</p>
        {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}

/** KPI cards do topo da Visão Geral (Seção 5.1). */
export function OverviewKpis({ rows }: { rows: CompetitorOverview[] }) {
  const topRating = maxBy(rows, (r) =>
    r.google_rating != null ? Number(r.google_rating) : null,
  );
  const topYt = maxBy(rows, (r) => r.yt_subscribers);
  const topIg = maxBy(rows, (r) => r.ig_followers);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Kpi
        icon={<Users className="h-4 w-4" />}
        label="Concorrentes monitorados"
        value={rows.length}
        sub="ativos"
      />
      <Kpi
        icon={<Star className="h-4 w-4" />}
        label="Maior rating Google"
        value={topRating ? formatRating(topRating.google_rating) : "—"}
        sub={topRating?.name}
      />
      <Kpi
        icon={<Video className="h-4 w-4" />}
        label="Mais inscritos (YouTube)"
        value={topYt ? formatCompact(topYt.yt_subscribers) : "—"}
        sub={topYt?.name}
      />
      <Kpi
        icon={<Camera className="h-4 w-4" />}
        label="Mais seguidores (Instagram)"
        value={topIg ? formatCompact(topIg.ig_followers) : "—"}
        sub={topIg?.name}
      />
    </div>
  );
}
