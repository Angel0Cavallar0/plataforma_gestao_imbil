"use client";

import type { InsightPeriod } from "@/lib/marketing/instagram-insights";
import { cn } from "@/lib/utils";

const OPTIONS: { value: InsightPeriod; label: string }[] = [
  { value: "total", label: "Total" },
  { value: "days", label: "7 dias" },
  { value: "weeks", label: "4 semanas" },
  { value: "months", label: "6 meses" },
];

type Props = {
  value: InsightPeriod;
  onChange: (period: InsightPeriod) => void;
};

export function InsightPeriodFilter({ value, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={cn(
            "rounded-md px-3 py-1.5 text-sm transition-colors",
            value === opt.value
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80",
          )}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
