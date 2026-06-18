import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDeltaInt, formatDeltaPct } from "@/lib/marketing/insights";

/**
 * Indicador de variação (delta) com seta e cor. Para métricas onde "menos é
 * melhor" (ex.: taxa de rejeição), use `goodWhenNegative`.
 */
export function DeltaBadge({
  value,
  mode = "pct",
  goodWhenNegative = false,
  className,
}: {
  value: number | null | undefined;
  mode?: "pct" | "int";
  goodWhenNegative?: boolean;
  className?: string;
}) {
  if (value == null || Number.isNaN(value)) {
    return <span className={cn("text-xs text-muted-foreground", className)}>—</span>;
  }

  const positive = value > 0;
  const neutral = value === 0;
  const isGood = neutral ? null : goodWhenNegative ? !positive : positive;

  const color = neutral
    ? "text-muted-foreground"
    : isGood
      ? "text-green-600 dark:text-green-400"
      : "text-red-600 dark:text-red-400";

  const Icon = neutral ? Minus : positive ? ArrowUpRight : ArrowDownRight;
  const label = mode === "pct" ? formatDeltaPct(value) : formatDeltaInt(value);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-xs font-medium",
        color,
        className,
      )}
    >
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}
