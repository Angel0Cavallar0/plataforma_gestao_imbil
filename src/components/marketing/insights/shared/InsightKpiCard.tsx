import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricInfo } from "@/components/marketing/ad-spend/shared/MetricInfo";
import { cn } from "@/lib/utils";

/** KPI card padrão dos Insights — valor em destaque, subtítulo e delta opcionais. */
export function InsightKpiCard({
  label,
  value,
  sub,
  delta,
  color,
  tooltip,
  className,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  delta?: ReactNode;
  /** Cor de marca (bolinha ao lado do título). */
  color?: string;
  tooltip?: string;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center text-sm font-medium text-muted-foreground">
          {color && (
            <span
              className="mr-1.5 inline-block h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: color }}
            />
          )}
          {label}
          {tooltip && <MetricInfo text={tooltip} />}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <p className={cn("text-2xl font-semibold tabular-nums")}>{value}</p>
          {delta}
        </div>
        {sub && <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>}
      </CardContent>
    </Card>
  );
}
