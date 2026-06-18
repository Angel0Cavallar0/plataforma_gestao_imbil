import { cn } from "@/lib/utils";

export type Kpi = { label: string; value: string; primary?: boolean };

/** Linha de KPIs principais de uma entidade do relatório (Seção 6-B.4). */
export function ReportEntityKpis({ items }: { items: Kpi[] }) {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
      {items.map((it) => (
        <span
          key={it.label}
          className={cn(
            "tabular-nums",
            it.primary
              ? "text-sm font-semibold text-foreground"
              : "text-xs text-muted-foreground",
          )}
        >
          <span className="font-normal text-muted-foreground">{it.label} </span>
          {it.value}
        </span>
      ))}
    </div>
  );
}
