"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { CalendarDays, Check, Loader2, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { fromIsoDate, toIsoDate } from "@/lib/marketing/ad-spend";
import { defaultInsightsRange } from "@/lib/marketing/insights";
import type { InsightsFilters as Filters } from "@/types/marketing-insights";

function rangeFromFilters(filters: Filters): DateRange {
  return { from: fromIsoDate(filters.date_from), to: fromIsoDate(filters.date_to) };
}

/**
 * Filtro de período dos Insights — mesmo padrão (Popover + Calendar range) do
 * filtro da Mídia Paga, simplificado para apenas o período. As alterações só
 * são aplicadas (gravadas na URL, preservando demais params) ao clicar em
 * "Aplicar".
 */
export function InsightsFilters({
  filters,
  defaultRange,
}: {
  filters: Filters;
  /** Período padrão (ex.: do relatório selecionado) usado em "Limpar". */
  defaultRange?: Filters;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const [range, setRange] = useState<DateRange | undefined>(rangeFromFilters(filters));
  const [open, setOpen] = useState(false);

  // Ressincroniza ao mudar os filtros aplicados (voltar/avançar), sem useEffect.
  const appliedKey = `${filters.date_from}|${filters.date_to}`;
  const [prevKey, setPrevKey] = useState(appliedKey);
  if (appliedKey !== prevKey) {
    setPrevKey(appliedKey);
    setRange(rangeFromFilters(filters));
  }

  function apply() {
    const params = new URLSearchParams(searchParams.toString());
    if (range?.from) params.set("date_from", toIsoDate(range.from));
    const end = range?.to ?? range?.from;
    if (end) params.set("date_to", toIsoDate(end));
    const qs = params.toString();
    startTransition(() =>
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false }),
    );
  }

  function clear() {
    const d = defaultRange ?? defaultInsightsRange();
    setRange({ from: fromIsoDate(d.date_from), to: fromIsoDate(d.date_to) });
    const params = new URLSearchParams(searchParams.toString());
    params.delete("date_from");
    params.delete("date_to");
    const qs = params.toString();
    startTransition(() =>
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false }),
    );
  }

  const rangeLabel =
    range?.from && range?.to
      ? `${format(range.from, "dd/MM/yyyy", { locale: ptBR })} – ${format(range.to, "dd/MM/yyyy", { locale: ptBR })}`
      : range?.from
        ? `${format(range.from, "dd/MM/yyyy", { locale: ptBR })} – …`
        : "Selecionar período";

  const def = defaultRange ?? defaultInsightsRange();
  const isDefaultView =
    !!range?.from &&
    !!range?.to &&
    toIsoDate(range.from) === def.date_from &&
    toIsoDate(range.to) === def.date_to;

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1 text-xs text-muted-foreground">
        Período
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-9 w-[16rem] justify-start font-normal",
              !range?.from && "text-muted-foreground",
            )}
          >
            <CalendarDays className="mr-2 h-4 w-4" />
            {rangeLabel}
          </PopoverTrigger>
          <PopoverContent>
            <Calendar
              mode="range"
              selected={range}
              onSelect={setRange}
              numberOfMonths={2}
              defaultMonth={range?.from}
              showOutsideDays={false}
              autoFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant={isDefaultView ? "secondary" : "default"}
          onClick={apply}
          disabled={pending}
          className="h-9"
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          Aplicar
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={clear}
          disabled={pending}
          className="h-9"
        >
          <X className="h-4 w-4" />
          Limpar
        </Button>
      </div>
    </div>
  );
}
