import { cn } from "@/lib/utils";

type TooltipEntry = {
  name?: string;
  value?: number | string;
  color?: string;
  dataKey?: string | number;
  payload?: Record<string, unknown>;
};

type Props = {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: unknown;
  /** Formata o valor numérico de cada linha. */
  formatValue?: (value: number) => string;
  /** Formata o título do tooltip (ex.: data). */
  formatLabel?: (label: unknown) => string;
  className?: string;
};

function entryColor(e: TooltipEntry): string | undefined {
  return (
    e.color ??
    (e.payload?.color as string | undefined) ??
    (e.payload?.fill as string | undefined)
  );
}

/**
 * Conteúdo de tooltip dos gráficos com uma "bolinha" da cor de cada série
 * (plataforma) antes do nome. Usado via `content={<ChartTooltipContent .../>}`,
 * o Recharts injeta active/payload/label.
 */
export function ChartTooltipContent({
  active,
  payload,
  label,
  formatValue,
  formatLabel,
  className,
}: Props) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div
      className={cn(
        "rounded-md border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md",
        className,
      )}
    >
      {label != null && label !== "" && (
        <p className="mb-1 font-medium">
          {formatLabel ? formatLabel(label) : String(label)}
        </p>
      )}
      <ul className="space-y-1">
        {payload.map((e, i) => {
          const value = typeof e.value === "number" ? e.value : Number(e.value);
          return (
            <li key={i} className="flex items-center gap-2">
              <span
                className="inline-block h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: entryColor(e) }}
              />
              <span className="text-muted-foreground">{e.name}</span>
              <span className="ml-auto font-medium tabular-nums">
                {formatValue && !Number.isNaN(value)
                  ? formatValue(value)
                  : String(e.value ?? "—")}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
