"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { CalendarDays, Loader2, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PERIOD_PRESETS, fromIsoDate, toIsoDate } from "@/lib/marketing/dashboard";
import type { DashboardPeriod, PeriodPreset } from "@/types/marketing-dashboard";

/**
 * Filtro global de período do dashboard. Cada preset recalcula todas as 7
 * categorias (a página relê os searchParams). O modo "Personalizado" usa o
 * calendário range (shadcn) num popover.
 */
export function DashboardPeriodFilter({ period }: { period: DashboardPeriod }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [range, setRange] = useState<DateRange | undefined>({
    from: fromIsoDate(period.from),
    to: fromIsoDate(period.to),
  });

  function navigate(params: URLSearchParams) {
    const qs = params.toString();
    startTransition(() =>
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false }),
    );
  }

  function selectPreset(preset: PeriodPreset) {
    if (preset === "custom") {
      setOpen(true);
      return;
    }
    const params = new URLSearchParams(searchParams.toString());
    params.set("preset", preset);
    params.delete("from");
    params.delete("to");
    navigate(params);
  }

  function applyCustom() {
    const from = range?.from;
    const to = range?.to ?? range?.from;
    if (!from || !to) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("preset", "custom");
    params.set("from", toIsoDate(from));
    params.set("to", toIsoDate(to));
    setOpen(false);
    navigate(params);
  }

  function refresh() {
    startTransition(() => router.refresh());
  }

  const customLabel =
    period.preset === "custom"
      ? `${format(fromIsoDate(period.from), "dd/MM/yy", { locale: ptBR })} – ${format(
          fromIsoDate(period.to),
          "dd/MM/yy",
          { locale: ptBR },
        )}`
      : "Personalizado";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex flex-wrap items-center gap-1 rounded-md border p-1">
        {PERIOD_PRESETS.filter((p) => p.value !== "custom").map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => selectPreset(p.value)}
            disabled={pending}
            aria-pressed={period.preset === p.value}
            className={cn(
              "rounded px-2.5 py-1 text-xs font-medium transition-colors",
              period.preset === p.value
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            {p.label}
          </button>
        ))}

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            className={cn(
              "inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors",
              period.preset === "custom"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            <CalendarDays className="h-3.5 w-3.5" />
            {customLabel}
          </PopoverTrigger>
          <PopoverContent className="w-auto">
            <Calendar
              mode="range"
              selected={range}
              onSelect={setRange}
              numberOfMonths={2}
              defaultMonth={range?.from}
              showOutsideDays={false}
              autoFocus
            />
            <div className="flex justify-end gap-2 border-t p-2">
              <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button size="sm" onClick={applyCustom} disabled={!range?.from}>
                Aplicar
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={refresh}
        disabled={pending}
        className="h-9"
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <RefreshCw className="h-4 w-4" />
        )}
        Atualizar
      </Button>
    </div>
  );
}
